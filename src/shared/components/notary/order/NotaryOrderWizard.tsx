"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Receipt,
  Send,
  Upload,
  UserRound,
} from "lucide-react";
import {
  OrderApiError,
  buildUploadQueue,
  submitOrder,
  uploadOrderFiles,
  type OrderReference,
  type OrderResult,
  type UploadFailure,
  type UploadQueueItem,
} from "@/shared/utils/notaryOrderApi";
import { loadReference } from "@/shared/utils/notaryReferenceData";
import {
  REFERENCE_PREFIX,
  SEGMENT_PREFIX,
  generateExternalReference,
} from "@/shared/utils/notaryOrderConfig";
import { formatMoney } from "@/shared/utils/notaryEstimate";
import { trackCta, triggerHotjarEvent } from "@/shared/utils/notaryTracking";
import OrderStepConfigure from "./OrderStepConfigure";
import OrderStepUpload from "./OrderStepUpload";
import OrderStepReview from "./OrderStepReview";
import OrderStepDetails from "./OrderStepDetails";
import OrderConfirmation, { type UploadPhase, type UploadProgress } from "./OrderConfirmation";
import {
  buildOrderPayload,
  buildNotes,
  calculateEstimate,
  createDocument,
  createInitialState,
  firstCopyTypeFor,
  totalFileCount,
  totalPageCount,
  validateConfigure,
  validateDetails,
  type OrderContact,
  type OrderDocument,
  type OrderState,
  type StepErrors,
} from "./orderState";

const STEP_COUNT = 4;

interface SubmitError {
  title: string;
  body: string;
  details: string[];
  /** Ambiguous outcomes never get a retry button — a human must reconcile. */
  allowRetry: boolean;
  reference?: string;
}

export default function NotaryOrderWizard() {
  const t = useTranslations("NotaryPage.order");

  const [reference, setReference] = useState<OrderReference | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [loadingReference, setLoadingReference] = useState(true);

  const [step, setStep] = useState(1);
  const [state, setState] = useState<OrderState>(createInitialState);
  const [errors, setErrors] = useState<StepErrors>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    done: 0,
    total: 0,
    currentFileName: "",
  });
  const [uploadFailures, setUploadFailures] = useState<UploadFailure[]>([]);

  /** Generated once per order attempt and kept, so an ambiguous timeout is reconcilable. */
  const externalReferenceRef = useRef<string>("");
  const nextDocumentId = useRef(2);

  // -------------------------------------------------------------------------
  // Reference data
  // -------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;
    loadReference().then((result) => {
      if (!mounted) return;
      setReference(result.reference);
      setIsFallback(result.isFallback);
      setLoadingReference(false);

      // Seed the first document's copy type so the tiles are never all unset.
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) =>
          doc.copyType
            ? doc
            : { ...doc, copyType: firstCopyTypeFor(result.reference, doc.serviceType) }
        ),
      }));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const estimate = useMemo(
    () => (reference ? calculateEstimate(state, reference) : null),
    [state, reference]
  );

  // -------------------------------------------------------------------------
  // State updates
  // -------------------------------------------------------------------------

  const patchDocument = useCallback((id: number, patch: Partial<OrderDocument>) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)),
    }));
  }, []);

  const addDocument = useCallback(() => {
    setState((prev) => {
      const doc = createDocument(nextDocumentId.current);
      nextDocumentId.current += 1;
      // Inherit the previous document's setup — most multi-document orders are
      // the same pair repeated.
      const last = prev.documents[prev.documents.length - 1];
      return {
        ...prev,
        documents: [
          ...prev.documents,
          last
            ? {
                ...doc,
                fromLang: last.fromLang,
                toLang: last.toLang,
                serviceType: last.serviceType,
                copyType: last.copyType,
              }
            : doc,
        ],
      };
    });
  }, []);

  const removeDocument = useCallback((id: number) => {
    setState((prev) =>
      prev.documents.length > 1
        ? { ...prev, documents: prev.documents.filter((doc) => doc.id !== id) }
        : prev
    );
  }, []);

  const toggleHandover = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      handover: prev.handover.includes(value)
        ? prev.handover.filter((v) => v !== value)
        : [...prev.handover, value],
    }));
  }, []);

  const patchContact = useCallback((patch: Partial<OrderContact>) => {
    setState((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));
  }, []);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const goNext = () => {
    if (!reference) return;

    if (step === 1) {
      const stepErrors = validateConfigure(state, reference, t);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;
      triggerHotjarEvent("order_configured");
    }

    setErrors({});
    setStep((current) => Math.min(current + 1, STEP_COUNT));
  };

  const goBack = () => {
    setErrors({});
    setSubmitError(null);
    setStep((current) => Math.max(current - 1, 1));
  };

  // -------------------------------------------------------------------------
  // Upload (runs after the order is committed; never throws)
  // -------------------------------------------------------------------------

  /**
   * Fallback route for source documents, used only when the order response
   * carries no `documents[]` and there is therefore no `document_id` to attach
   * to. This deployment does return them, so the direct upload normally wins —
   * but older ones don't, and the partner's guide says to "coordinate that
   * separately (e.g. email them referencing the order_id)" in that case. Doing
   * it automatically beats printing the instruction and hoping the client
   * follows it. Never throws — the order is already placed.
   */
  const sendFilesByEmail = useCallback(
    async (orderId: number | string): Promise<boolean> => {
      const files = state.documents.flatMap((doc) => doc.files);
      if (files.length === 0) return true;

      const { contact } = state;
      const form = new FormData();
      form.append(
        "name",
        `${contact.firstName} ${contact.lastName}`.trim() || contact.firstName
      );
      form.append("email", contact.email.trim());
      form.append("phone", contact.phone.trim());
      form.append("source_language", state.documents.map((d) => d.fromLang).join(", "));
      form.append("target_language", state.documents.map((d) => d.toLang).join(", "));
      form.append("notarial_certification", estimate?.hasNotarized ? "Yes" : "No");
      form.append(
        "order_summary",
        [
          `Source documents for partner order #${orderId}`,
          `Reference: ${externalReferenceRef.current}`,
          buildNotes(state),
        ]
          .filter(Boolean)
          .join("\n")
      );
      files.forEach((file) => form.append("files", file));

      try {
        const response = await fetch("/api/notary-upload", { method: "POST", body: form });
        return response.ok;
      } catch {
        return false;
      }
    },
    [state, estimate]
  );

  const runUploads = useCallback(
    async (orderId: number | string, queue: UploadQueueItem[]) => {
      if (queue.length === 0) {
        setUploadPhase("idle");
        return;
      }

      setUploadPhase("uploading");
      setUploadProgress({ done: 0, total: queue.length, currentFileName: queue[0].file.name });

      // No document_id means this deployment publishes no `documents[]` on the
      // order, so there is nothing to attach files to (§16.4). Fall back to the
      // partner's documented alternative instead of failing every file.
      if (queue.some((item) => item.documentId === null)) {
        const sent = await sendFilesByEmail(orderId);
        setUploadProgress({
          done: queue.length,
          total: queue.length,
          currentFileName: "",
        });

        if (sent) {
          setUploadFailures([]);
          setUploadPhase("emailed");
          return;
        }

        setUploadFailures(
          queue.map((item) => ({
            key: item.key,
            fileName: item.file.name,
            kind: "unsupported" as const,
            message: t("uploadEmailFailed"),
            retryable: false,
          }))
        );
        setUploadPhase("partial");
        return;
      }

      const outcome = await uploadOrderFiles(orderId, queue, (done, total, current) => {
        setUploadProgress({
          done,
          total,
          currentFileName: current?.file.name ?? "",
        });
      });

      setUploadFailures(outcome.failed);
      setUploadPhase(outcome.failed.length === 0 ? "complete" : "partial");
    },
    [sendFilesByEmail, t]
  );

  const retryUploads = useCallback(() => {
    if (!order) return;
    const retryKeys = new Set(uploadFailures.filter((f) => f.retryable).map((f) => f.key));
    const queue = buildUploadQueue(state.documents, order.documents).filter((item) =>
      retryKeys.has(item.key)
    );
    // Keep the unretryable failures visible; the retry only re-runs the rest.
    setUploadFailures((prev) => prev.filter((f) => !f.retryable));
    void runUploads(order.order_id, queue);
  }, [order, uploadFailures, state.documents, runUploads]);

  // -------------------------------------------------------------------------
  // Submit (§5.4, §5.6)
  // -------------------------------------------------------------------------

  /**
   * Email fallback, used when the partner catalogue was unreachable. Routes the
   * whole order — details, estimate and files — to the office inbox instead.
   */
  const submitViaEmail = async (): Promise<OrderResult> => {
    const form = new FormData();
    const { contact } = state;

    form.append("name", `${contact.firstName} ${contact.lastName}`.trim() || contact.firstName);
    form.append("email", contact.email.trim());
    form.append("phone", contact.phone.trim());
    form.append("source_language", state.documents.map((d) => d.fromLang).join(", "));
    form.append("target_language", state.documents.map((d) => d.toLang).join(", "));
    form.append(
      "notarial_certification",
      estimate?.hasNotarized ? "Yes" : "No"
    );
    form.append(
      "order_summary",
      [
        `Reference: ${externalReferenceRef.current}`,
        `Urgency: ${state.urgency}`,
        `Handover: ${state.handover.join(", ")}`,
        `Documents: ${state.documents.length}, pages: ${totalPageCount(state)}`,
        `Estimated total: ${estimate?.total.toFixed(2)} ${estimate?.currency}`,
        buildNotes(state),
      ]
        .filter(Boolean)
        .join("\n")
    );

    state.documents.forEach((doc) => doc.files.forEach((file) => form.append("files", file)));

    const response = await fetch("/api/notary-upload", { method: "POST", body: form });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new OrderApiError(body?.error ?? "Could not send the order.", {
        kind: response.status >= 500 ? "server" : "unknown",
        status: response.status,
      });
    }

    return {
      order_id: externalReferenceRef.current,
      total: estimate?.total ?? 0,
      currency: estimate?.currency ?? "₾",
    };
  };

  const handleSubmit = async () => {
    if (!reference || submitting) return;

    const stepErrors = validateDetails(state, reference, t);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    // The partner stores and displays external_reference but has no client-type
    // field, and ignores acquisition_source — so both the origin and the segment
    // ride in the prefix: SL-B2B-… / SL-B2C-…
    externalReferenceRef.current = generateExternalReference(
      `${REFERENCE_PREFIX}-${SEGMENT_PREFIX[state.contact.clientType]}`
    );

    try {
      const result = isFallback
        ? await submitViaEmail()
        : await submitOrder(buildOrderPayload(state, externalReferenceRef.current));

      // Fires only now, after the order was accepted — never on the button
      // press. Firing on the press counts validation bounces and server errors
      // as leads (§11).
      trackCta("order_submit", "submit", {
        documents: state.documents.length,
        pages: totalPageCount(state),
        quoted_total: Number((estimate?.total ?? 0).toFixed(2)),
        files: totalFileCount(state),
      });
      triggerHotjarEvent("order_placed");

      setOrder(result);

      // Files upload after the commit, because they need order_id/document_id.
      if (!isFallback) {
        void runUploads(
          result.order_id,
          buildUploadQueue(state.documents, result.documents)
        );
      }
    } catch (error) {
      setSubmitError(describeSubmitError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const describeSubmitError = (error: unknown): SubmitError => {
    if (error instanceof OrderApiError) {
      if (error.ambiguous) {
        return {
          title: t("errorAmbiguousTitle"),
          body: t("errorAmbiguousBody"),
          details: [],
          allowRetry: false,
          reference: externalReferenceRef.current,
        };
      }
      if (error.kind === "validation") {
        return {
          title: t("errorValidationTitle"),
          body: t("errorValidationBody"),
          details: error.errors,
          allowRetry: true,
        };
      }
      if (error.kind === "auth") {
        return {
          title: t("errorConfigTitle"),
          body: t("errorConfigBody"),
          details: [],
          allowRetry: false,
        };
      }
      if (error.kind === "unavailable") {
        return {
          title: t("errorServerTitle"),
          body: t("errorUnavailableBody"),
          details: [],
          allowRetry: true,
        };
      }
      return {
        title: t("errorServerTitle"),
        body: t("errorServerBody"),
        details: [],
        allowRetry: true,
      };
    }

    return {
      title: t("errorServerTitle"),
      body: t("errorServerBody"),
      details: [],
      allowRetry: true,
    };
  };

  const startNewOrder = () => {
    setState(createInitialState());
    setOrder(null);
    setStep(1);
    setErrors({});
    setSubmitError(null);
    setUploadPhase("idle");
    setUploadFailures([]);
    setUploadProgress({ done: 0, total: 0, currentFileName: "" });
    nextDocumentId.current = 2;
    if (reference) {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) => ({
          ...doc,
          copyType: firstCopyTypeFor(reference, doc.serviceType),
        })),
      }));
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loadingReference || !reference || !estimate) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t("loadingOptions")}</span>
      </div>
    );
  }

  if (order) {
    return (
      <OrderConfirmation
        order={order}
        externalReference={externalReferenceRef.current}
        estimateOnly={isFallback}
        phase={uploadPhase}
        progress={uploadProgress}
        failures={uploadFailures}
        onRetryUploads={retryUploads}
        onStartNew={startNewOrder}
      />
    );
  }

  const stepTitles = [t("step1"), t("step2"), t("step3"), t("step4")];
  const stepSubtitles = [t("step1Sub"), t("step2Sub"), t("step3Sub"), t("step4Sub")];
  const StepIcon = [FileText, Upload, Receipt, UserRound][step - 1] ?? FileText;

  return (
    <div className="space-y-5">
      {/* Step header — title, what this step is for, and where you are. */}
      <div className="-mx-3 -mt-4 mb-1 bg-linear-to-r from-suliko-default-color to-indigo-600 px-5 py-4 text-white sm:-mx-5 sm:-mt-6 md:-mx-6 md:-mt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <StepIcon className="mt-0.5 h-6 w-6 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-lg font-bold leading-tight">{stepTitles[step - 1]}</h4>
              <p className="mt-0.5 text-xs text-white/80">{stepSubtitles[step - 1]}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-suliko-default-color">
            {t("stepOf", { current: step, total: STEP_COUNT })}
          </span>
        </div>

        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                index < step ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/*
        Keyed enter-only animation rather than AnimatePresence + `exit`.
        With `mode="wait"` the outgoing step has to finish exiting before the
        next one mounts, and when that exit does not settle the wizard sticks on
        the old step forever. Remounting on `key` cannot hang.
      */}
      <div>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <OrderStepConfigure
              state={state}
              reference={reference}
              errors={errors}
              onPatchDocument={patchDocument}
              onAddDocument={addDocument}
              onRemoveDocument={removeDocument}
              onSetUrgency={(urgency) => setState((prev) => ({ ...prev, urgency }))}
              onToggleHandover={toggleHandover}
            />
          )}
          {step === 2 && <OrderStepUpload state={state} onPatchDocument={patchDocument} />}
          {step === 3 && (
            <OrderStepReview state={state} reference={reference} estimate={estimate} />
          )}
          {step === 4 && (
            <OrderStepDetails
              state={state}
              reference={reference}
              errors={errors}
              onPatchContact={patchContact}
            />
          )}
        </motion.div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{submitError.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {submitError.body}
              </p>
              {submitError.details.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-0.5">
                  {submitError.details.map((detail) => (
                    <li key={detail} className="text-xs text-muted-foreground">
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
              {submitError.reference && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t("reference")}:{" "}
                  <span className="font-mono">{submitError.reference}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer: running estimate + navigation */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {step > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("estimatedTotal")}</span>
            <span className="font-bold text-suliko-default-color">
              {formatMoney(estimate.total, estimate.currency)}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>
          )}

          {step < STEP_COUNT ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-suliko-default-color px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-suliko-default-hover-color"
            >
              {t("continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (submitError !== null && !submitError.allowRetry)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-suliko-default-color px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-suliko-default-hover-color disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t("placeOrder")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
