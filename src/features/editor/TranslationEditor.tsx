"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "@/features/ui/components/ui/button";
import { originalPageSetup } from "@/features/translation/utils/originalPage";
import { translationAsHtml, wordPage, type WordPageSetup } from "@/features/translation/utils/wordPage";
import NewEditor, { type NewEditorHandle } from "./NewEditor";
import { htmlToSfdt, toPdf as docxToPdf, toSfdt } from "./documentEditorService";
import { htmlToPlainText } from "./sfdtToHtml";
import { registerSuggestionTarget } from "./suggestionTarget";
import type { WordEditorHandle } from "./WordEditor";

// Syncfusion reaches for `window` when it loads, and is a large download that only the
// translation result needs: loaded on the client, when the result is shown.
const WordEditor = dynamic(() => import("./WordEditor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

function EditorSkeleton({ className = "h-full" }: { className?: string }) {
  return <div className={`${className} min-h-[240px] animate-pulse rounded-md bg-muted/50`} aria-hidden="true" />;
}

export interface TranslationEditorHandle extends NewEditorHandle {
  /**
   * The document as a Word file, written by the Word editor. Null when the simple editor is
   * the one in use: the caller then builds a Word file from `getHTML()`.
   */
  toDocx(): Promise<Blob> | null;
  /**
   * The document as a PDF, made by the server from the Word file (so it is laid out as Word lays
   * it out). Null when the simple editor is in use. Rejects when the server cannot make it: the
   * caller then makes one from the HTML, as before.
   */
  toPdf(): Promise<Blob> | null;
  /** Prints the document as the Word editor lays it out (the browser can save that as a PDF). */
  print(): void;
}

interface TranslationEditorProps {
  /** What the translation service sent (Markdown or HTML), or what the person saved of it. */
  translatedMarkdown: string;
  /** Called with the document as HTML after the person edits it. */
  onChange?: (html: string) => void;
  hoveredText?: string | null;
  /** The file that was translated: its paper is the paper the translation is laid out on. */
  file?: File | null;
  /** Subtitles and the like have no pages: the simple editor. */
  forceSimple?: boolean;
  /** The element that scrolls the pages, for the screen that keeps the original beside it. */
  onScroller?: (element: HTMLElement | null) => void;
  /** The Word editor's height on the page (it fills the box it is given). */
  className?: string;
  /**
   * A Word file to open instead of converting the text above: what the Word editor saved for a
   * translation last time (headers, footers and page breaks come back), or a Word file in an
   * order. Asked for once, when the editor first opens; null, or a file that cannot be opened,
   * and the text above is used.
   */
  openDocument?: () => Promise<Blob | null>;
  /**
   * Only the Word editor will do (there is no HTML to fall back on): when it cannot be had,
   * nothing is shown and `onUnavailable` is called.
   */
  wordOnly?: boolean;
  onUnavailable?: () => void;
  /** Called when the Word editor has opened the document, with what it holds as HTML. */
  onOpened?: (html: string) => void;
  /** The screen already says what the editor is: leave out the line above it. */
  hideHint?: boolean;
}

/** The simple editor can be asked for with `?classic=1` (or kept with `suliko:classic-editor`). */
function simpleEditorAsked(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("classic") === "1") return true;
    return window.localStorage.getItem("suliko:classic-editor") === "1";
  } catch {
    return false;
  }
}

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * The editor of a translation. The Word editor (Syncfusion), where the translation is a page
 * to correct as it will be printed; the simple editor (Tiptap) when the Word editor cannot be
 * had, so the page is never left without one: for subtitles, when the server cannot turn the
 * translation into the Word editor's format, or when the person asks for it.
 *
 * The rest of the site works on the translation as HTML (the autosave, the review of the
 * translation, copying, the PDF), so the Word editor keeps `onChange` fed with its document
 * written out as HTML, a moment after the person stops typing.
 */
const TranslationEditor = forwardRef<TranslationEditorHandle, TranslationEditorProps>(
  function TranslationEditor(
    {
      translatedMarkdown,
      onChange,
      hoveredText,
      file,
      forceSimple = false,
      onScroller,
      className = "h-full",
      openDocument,
      wordOnly = false,
      onUnavailable,
      onOpened,
      hideHint = false,
    },
    ref,
  ) {
    const t = useTranslations("WordEditor");
    const wordRef = useRef<WordEditorHandle>(null);
    const simpleRef = useRef<NewEditorHandle>(null);

    const [engine, setEngine] = useState<"loading" | "word" | "simple" | "unavailable">(
      forceSimple ? "simple" : "loading",
    );
    const [sfdt, setSfdt] = useState<string | null>(null);
    const [fullScreen, setFullScreen] = useState(false);

    // The HTML for this document as it stands: what was loaded, then what the editor wrote.
    const latestHtml = useRef("");
    // What the page last gave us, and what we last gave it: told apart so the editor's own
    // HTML coming back through the page is not mistaken for a new translation.
    const loaded = useRef<string | null>(null);
    const emitted = useRef<string | null>(null);
    const request = useRef(0);
    // Once the simple editor has been taken up (the Word editor could not be had, or was not
    // wanted), the person's edits in it come back through this page as new "translations":
    // they are not converted, or the Word editor would take the page back mid-edit.
    const simple = useRef(forceSimple);
    const mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const openDocumentRef = useRef(openDocument);
    openDocumentRef.current = openDocument;
    const onUnavailableRef = useRef(onUnavailable);
    onUnavailableRef.current = onUnavailable;
    const onOpenedRef = useRef(onOpened);
    onOpenedRef.current = onOpened;
    // A Word file is opened once, the first time; after that the text is what is converted.
    const documentAsked = useRef(false);

    // The paper of the original, found once per file.
    const pageFor = useRef<{ file: File | null | undefined; page: Promise<WordPageSetup> } | null>(null);
    const paperOf = useCallback((target: File | null | undefined) => {
      if (!pageFor.current || pageFor.current.file !== target) {
        pageFor.current = { file: target, page: originalPageSetup(target) };
      }
      return pageFor.current.page;
    }, []);

    // Opened when the translation arrives, and again if it is replaced from outside (not when
    // it is only the editor's own HTML coming back through the page).
    useEffect(() => {
      if (forceSimple || simple.current) {
        simple.current = true;
        setEngine("simple");
        return;
      }
      const wantsDocument = !!openDocumentRef.current && !documentAsked.current;
      if (!translatedMarkdown && !wantsDocument) return;
      if (
        !wantsDocument &&
        (translatedMarkdown === emitted.current || translatedMarkdown === loaded.current)
      ) {
        return;
      }
      if (!wordOnly && simpleEditorAsked()) {
        simple.current = true;
        setEngine("simple");
        return;
      }

      loaded.current = translatedMarkdown;
      const html = translatedMarkdown ? translationAsHtml(translatedMarkdown) : "";
      latestHtml.current = html;
      const mine = ++request.current;
      const unavailable = (error: unknown) => {
        if (mine !== request.current || !mounted.current) return;
        console.warn("The Word editor could not be opened.", error);
        if (wordOnly) {
          setEngine("unavailable");
          onUnavailableRef.current?.();
        } else {
          simple.current = true;
          setEngine("simple");
        }
      };
      (async () => {
        try {
          let document: string | null = null;
          if (wantsDocument) {
            documentAsked.current = true;
            try {
              const saved = await openDocumentRef.current!();
              if (saved) document = await toSfdt(saved, "translation.docx");
            } catch (error) {
              // The Word file is only a better way in; the text is still there.
              if (!html) throw error;
              console.warn("The saved Word file could not be opened; using the text.", error);
            }
          }
          if (document === null) {
            if (!html) throw new Error("There is nothing to open.");
            document = await htmlToSfdt(wordPage(html), await paperOf(file));
          }
          // A newer translation arrived meanwhile, or the page is gone.
          if (mine !== request.current || !mounted.current) return;
          setSfdt(document);
          setEngine("word");
        } catch (error) {
          unavailable(error);
        }
      })();
    }, [translatedMarkdown, forceSimple, file, paperOf, wordOnly]);

    // The document written out as HTML for the page, once the person pauses.
    const timer = useRef<number | undefined>(undefined);
    const pending = useRef(false);
    const emit = useCallback(() => {
      window.clearTimeout(timer.current);
      if (!pending.current) return;
      pending.current = false;
      try {
        const html = wordRef.current?.getHTML();
        if (html === undefined) return;
        latestHtml.current = html;
        emitted.current = html;
        onChangeRef.current?.(html);
      } catch (error) {
        console.warn("The document could not be written out as HTML.", error);
      }
    }, []);
    const edited = useCallback(() => {
      pending.current = true;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(emit, 400);
    }, [emit]);
    // Leaving the page mid-edit still hands over what was written.
    useEffect(() => emit, [emit]);

    // Suggestions are applied in the Word editor's document, not in the HTML under it.
    const plain = useRef({ html: "", text: "" });
    useEffect(() => {
      if (engine !== "word") return;
      return registerSuggestionTarget({
        has: (quote) => {
          if (plain.current.html !== latestHtml.current) {
            plain.current = { html: latestHtml.current, text: normalize(htmlToPlainText(latestHtml.current)) };
          }
          return normalize(quote).length > 0 && plain.current.text.includes(normalize(quote));
        },
        replace: (find, replacement) => {
          const count = wordRef.current?.replaceText(find, replacement) ?? 0;
          if (count > 0) edited();
          return count;
        },
      });
    }, [engine, edited]);

    // A suggestion pointed at with the mouse is shown in the document.
    useEffect(() => {
      if (engine === "word") wordRef.current?.highlight(hoveredText ?? null);
    }, [engine, hoveredText, sfdt]);

    // Full screen is a different toolbar, so the editor is built again: from the document as it is now.
    const toggleFullScreen = () => {
      try {
        setSfdt(wordRef.current?.serialize() ?? sfdt);
      } catch {
        // Keep the document that was opened.
      }
      setFullScreen((full) => !full);
    };
    useEffect(() => {
      if (!fullScreen) return;
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") toggleFullScreen();
      };
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = overflow;
        window.removeEventListener("keydown", onKey);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullScreen]);

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => {
          if (engine === "word") {
            try {
              return wordRef.current?.getHTML() ?? latestHtml.current;
            } catch {
              return latestHtml.current;
            }
          }
          return simpleRef.current?.getHTML() ?? "";
        },
        toDocx: () => (engine === "word" ? (wordRef.current?.toDocx() ?? null) : null),
        toPdf: () => {
          const docx = engine === "word" ? wordRef.current?.toDocx() : null;
          return docx ? docx.then((word) => docxToPdf(word)) : null;
        },
        print: () => wordRef.current?.print(),
      }),
      [engine],
    );

    useEffect(() => {
      if (engine !== "word") onScroller?.(null);
    }, [engine, onScroller]);

    if (engine === "simple") {
      return (
        <>
          {!forceSimple && (
            <p className="mb-2 text-xs text-muted-foreground">{t("simpleEditorNotice")}</p>
          )}
          <NewEditor
            ref={simpleRef}
            translatedMarkdown={translatedMarkdown}
            onChange={onChange}
            hoveredText={hoveredText}
          />
        </>
      );
    }

    if (engine === "unavailable") return null;
    if (engine === "loading" || !sfdt) return <EditorSkeleton className={className} />;

    return (
      <div
        className={
          fullScreen
            ? "fixed inset-0 z-[100] flex flex-col bg-background"
            : `flex ${className} min-h-[320px] flex-col`
        }
      >
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className={fullScreen ? "px-3 pt-2 text-sm font-semibold" : "text-xs text-muted-foreground"}>
            {fullScreen ? t("fullScreenTitle") : hideHint ? "" : t("hint")}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleFullScreen}
            className={fullScreen ? "mr-3 mt-2" : ""}
            title={fullScreen ? t("exitFullScreen") : t("fullScreen")}
            aria-label={fullScreen ? t("exitFullScreen") : t("fullScreen")}
          >
            {fullScreen ? <Minimize2 className="mr-1 h-4 w-4" /> : <Maximize2 className="mr-1 h-4 w-4" />}
            <span className="hidden sm:inline">{fullScreen ? t("exitFullScreen") : t("fullScreen")}</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          <WordEditor
            key={fullScreen ? "full" : "compact"}
            sfdt={sfdt}
            mode={fullScreen ? "full" : "compact"}
            onChange={edited}
            onOpened={() => {
              // What was opened, as HTML: the suggestions' quotes are looked for in it, and
              // whoever opened a Word file has no HTML of it otherwise.
              try {
                const html = wordRef.current?.getHTML();
                if (html === undefined) return;
                if (!latestHtml.current) latestHtml.current = html;
                onOpenedRef.current?.(html);
              } catch {
                // Nothing to tell.
              }
            }}
            scrollerRef={onScroller}
            handle={wordRef}
          />
        </div>
      </div>
    );
  },
);

export default TranslationEditor;
