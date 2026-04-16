"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/features/ui/components/ui/form";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { Loader2, User } from "lucide-react";
import {
  register,
  login,
  sendCode,
  loginWithGoogle,
} from "@/features/auth/services/authorizationService";
import GoogleButton from "./GoogleButton";
import SulikoLogo from "./SulikoLogo";
import { updateUserProfile } from "@/features/auth/services/userService";
import PasswordRecoveryModal from "@/features/auth/components/PasswordRecoveryModal";
import type { RegisterParams } from "@/features/auth/services/authorizationService";
import ErrorAlert from "./ErrorAlert";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { SendVerificationCodeResponse } from "@/features/auth/types/types.Auth";
import { generateDefaultName } from "@/shared/utils/generateDefaultName";
import { getRequiredVerificationMethod } from "@/shared/utils/domainUtils";
import { trackRegistrationStart, trackRegistrationComplete } from "./MetaPixel";
import { trackRegistrationServerEvent, trackRegistrationStartServerEvent } from "../utils/facebookServerEvents";
import "../utils/testFacebookEvents"; // Import test utilities
import PhoneVerificationSection from "./PhoneVerificationSection";
import EmailVerificationSection from "./EmailVerificationSection";
import PasswordSection from "./PasswordSection";
import NameSection from "./NameSection";
import TermsSection from "./TermsSection";
import RegistrationStepper from "./RegistrationStepper";
import {
  createLoginFormSchema,
  createRegisterFormSchema,
  LoginFormData,
  RegisterFormData,
} from "@/features/auth/types/types.Auth";

type RegistrationStep = 1 | 2 | 3;

const SulikoForm: React.FC = () => {
  const t = useTranslations("Authorization");
  const tError = useTranslations("ErrorAlert");
  const locale = useLocale();
  const router = useRouter();
  const { setToken, setRefreshToken, triggerWelcomeModal } = useAuthStore();
  const fetchUserProfile = useUserStore((state) => state.fetchUserProfile);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(1);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [sentVerificationCode, setSentVerificationCode] = useState<string>("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"phone" | "email" | null>(null);

  const formSchema = useMemo(
    () =>
      isLoginMode
        ? createLoginFormSchema(t, locale)
        : createRegisterFormSchema(t, locale).refine(
          (data) => data.password === data.confirmPassword,
          {
            message: t("passwordsDoNotMatch"),
            path: ["confirmPassword"],
          }
        ),
    [t, locale, isLoginMode]
  );

  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(formSchema as z.ZodType<LoginFormData | RegisterFormData>),
    defaultValues: {
      identifier: "",
      mobile: "",
      password: "",
      firstname: "",
      lastname: "",
      email: "",
      confirmPassword: "",
      verificationCode: "",
      acceptTerms: false,
      acceptPrivacyPolicy: false,
      subscribeNewsletter: false,
    },
  });

  const verificationCode = form.watch("verificationCode");

  useEffect(() => {
    if (
      !isLoginMode &&
      verificationCode &&
      sentVerificationCode &&
      verificationCode === sentVerificationCode
    ) {
      setIsCodeVerified(true);
    } else {
      setIsCodeVerified(false);
    }
  }, [verificationCode, sentVerificationCode, isLoginMode]);

  useEffect(() => {
    if (!isLoginMode) {
      const requiredMethod = getRequiredVerificationMethod();
      if (requiredMethod && !verificationMethod) {
        setVerificationMethod(requiredMethod);
      }
    }
  }, [isLoginMode, verificationMethod]);

  function resetRegistrationState() {
    setRegistrationStep(1);
    setAuthError(null);
    setIsCodeSent(false);
    setIsSendingCode(false);
    setResendTimer(0);
    setSentVerificationCode("");
    setIsCodeVerified(false);
  }

  function toggleAuthMode() {
    const newIsLoginMode = !isLoginMode;
    setIsLoginMode(newIsLoginMode);
    resetRegistrationState();

    if (!newIsLoginMode) {
      const requiredMethod = getRequiredVerificationMethod();
      setVerificationMethod(requiredMethod);
      trackRegistrationStart();
      trackRegistrationStartServerEvent();
    } else {
      setVerificationMethod(null);
      form.setValue("identifier", "");
    }
  }

  async function handleSendPhoneCode() {
    const mobile = form.getValues("mobile");
    const valid = await form.trigger("mobile");
    if (!valid) return;

    if (!mobile || !mobile.trim()) {
      setAuthError(t("phoneNumberRequiredError"));
      return;
    }

    setIsSendingCode(true);
    setAuthError(null);
    setVerificationMethod("phone");

    try {
      const response = await sendCode(mobile.trim(), undefined) as SendVerificationCodeResponse;
      setSentVerificationCode(response.code.toString());
      setIsCodeSent(true);

      setResendTimer(30);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("sendCodeError");
      console.error("Send phone code error:", errorMessage);
      setAuthError(tError("ups"));
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleSendEmailCode() {
    const email = form.getValues("email");
    const valid = await form.trigger("email");
    if (!valid) return;

    if (!email || !email.trim()) {
      setAuthError(t("emailRequiredError"));
      return;
    }

    setIsSendingCode(true);
    setAuthError(null);
    setVerificationMethod("email");

    try {
      const response = await sendCode(undefined, email.trim()) as SendVerificationCodeResponse;
      setSentVerificationCode(response.code.toString());
      setIsCodeSent(true);

      setResendTimer(30);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("sendCodeError");
      console.error("Send email code error:", errorMessage);
      setAuthError(tError("ups"));
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleResendCode() {
    if (resendTimer > 0) return;
    if (verificationMethod === "phone") {
      await handleSendPhoneCode();
    } else if (verificationMethod === "email") {
      await handleSendEmailCode();
    }
  }

  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  async function handleContinueStep1() {
    if (!isCodeVerified) return;
    setRegistrationStep(2);
  }

  async function handleContinueStep2() {
    const fields: Array<keyof RegisterFormData> = ["firstname", "lastname"];
    if (verificationMethod !== "email") fields.push("email");
    const valid = await form.trigger(fields);
    if (!valid) return;
    setRegistrationStep(3);
  }

  async function onSubmit(values: LoginFormData | RegisterFormData) {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        const loginValues = values as LoginFormData;
        const identifier = loginValues.identifier?.trim() || "";
        const isEmailValue = isEmail(identifier);
        const data = await login({
          phoneNumber: isEmailValue ? undefined : identifier,
          email: isEmailValue ? identifier : undefined,
          password: loginValues.password,
        });
        setToken(data.token);
        setRefreshToken(data.refreshToken);

        try {
          await fetchUserProfile();
          const profileState = useUserStore.getState().userProfile;
          if (profileState && profileState.hasSeenRegistrationBonus === false) {
            await updateUserProfile({
              id: profileState.id,
              firstName: profileState.firstName,
              lastName: profileState.lastName,
              phoneNUmber: profileState.phoneNUmber,
              email: profileState.email,
              userName: profileState.userName,
              roleId: profileState.roleId,
              balance: profileState.balance,
              hasSeenRegistrationBonus: true,
            });
            setUserProfile({ ...profileState, hasSeenRegistrationBonus: true });
            triggerWelcomeModal();
          }
        } catch (profileError) {
          console.error("Failed to check/update registration bonus flag:", profileError);
        }
        router.push("/document");
      } else {
        const registerValues = values as RegisterFormData;
        if (!isCodeSent || !verificationMethod) {
          setAuthError(t("pleaseSendCodeFirst"));
          return;
        }
        if (!registerValues.verificationCode) {
          setAuthError(t("pleaseEnterVerificationCode"));
          return;
        }
        if (registerValues.verificationCode !== sentVerificationCode) {
          setAuthError(t("incorrectVerificationCode"));
          return;
        }

        const phoneNumber = verificationMethod === "phone" ? registerValues.mobile : undefined;
        const email = registerValues.email;

        if (!phoneNumber && !email) {
          setAuthError("Either phone number or email must be verified");
          return;
        }

        const data = await register({
          phoneNumber: phoneNumber || "",
          password: registerValues.password,
          firstname: registerValues.firstname || generateDefaultName(),
          lastname: registerValues.lastname || "",
          email: email,
          verificationCode: registerValues.verificationCode,
          subscribeNewsletter: registerValues.subscribeNewsletter,
        } as RegisterParams);

        trackRegistrationComplete({
          phoneNumber: phoneNumber || "",
          firstName: registerValues.firstname || generateDefaultName(),
          lastName: registerValues.lastname || "",
        });

        await trackRegistrationServerEvent({
          phone: phoneNumber || "",
          firstName: registerValues.firstname || generateDefaultName(),
          lastName: registerValues.lastname || "",
        });

        setToken(data.token);
        setRefreshToken(data.refreshToken);

        try {
          await fetchUserProfile();
          const profileState = useUserStore.getState().userProfile;
          if (profileState) {
            const { roleName, ...profileData } = profileState;
            const updatePayload = {
              ...profileData,
              ...(email && { email }),
            };
            await updateUserProfile(updatePayload);
            setUserProfile({ ...updatePayload, roleName });
          }
        } catch (syncError) {
          console.error("Failed to sync profile after registration:", syncError);
        }

        triggerWelcomeModal();
        router.push("/document");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Authentication failed, Invalid credentials";

      console.error("Authentication error:", errorMessage);

      if (!isLoginMode && errorMessage.includes("REGISTRATION_SUCCESS_LOGIN_FAILED")) {
        // Registration succeeded but auto-login failed — switch to login view
        resetRegistrationState();
        setIsLoginMode(true);
        form.setValue("identifier", "");
        setAuthError(t("registrationSuccessLoginFailed") || "Registration complete! Please sign in.");
      } else if (!isLoginMode && errorMessage.includes("უკვე რეგისტრირებულია")) {
        setAuthError(t("alreadyRegistered"));
      } else if (isLoginMode && errorMessage.includes("ვერ მოიძებნა")) {
        setAuthError(t("accountNotFound"));
      } else {
        setAuthError(tError("ups"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePhoneChange = () => {
    if (isCodeSent && verificationMethod === "phone") {
      setIsCodeSent(false);
      setIsCodeVerified(false);
      setSentVerificationCode("");
      setResendTimer(0);
      const requiredMethod = getRequiredVerificationMethod();
      if (!requiredMethod) {
        setVerificationMethod(null);
      }
      form.setValue("verificationCode", "");
    }
  };

  const handleEmailChange = () => {
    if (isCodeSent && verificationMethod === "email") {
      setIsCodeSent(false);
      setIsCodeVerified(false);
      setSentVerificationCode("");
      setResendTimer(0);
      const requiredMethod = getRequiredVerificationMethod();
      if (!requiredMethod) {
        setVerificationMethod(null);
      }
      form.setValue("verificationCode", "");
    }
  };

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      await fetchUserProfile();
      const profileState = useUserStore.getState().userProfile;
      if (profileState && profileState.hasSeenRegistrationBonus === false) {
        await updateUserProfile({
          id: profileState.id,
          firstName: profileState.firstName,
          lastName: profileState.lastName,
          phoneNUmber: profileState.phoneNUmber,
          email: profileState.email,
          userName: profileState.userName,
          roleId: profileState.roleId,
          balance: profileState.balance,
          hasSeenRegistrationBonus: true,
        });
        setUserProfile({ ...profileState, hasSeenRegistrationBonus: true });
        triggerWelcomeModal();
      }
      router.push("/document");
    } catch (error) {
      console.error("Google login error:", error);
      setAuthError(tError("ups"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {authError && (
        <ErrorAlert
          message={authError}
          onClose={() => setAuthError(null)}
        />
      )}

      {/* Acrylic card */}
      <div className="
        w-[92%] sm:w-full max-w-[480px] z-[2] my-8
        backdrop-blur-xl backdrop-saturate-150
        bg-white/65 dark:bg-white/[0.06]
        border border-white/60 dark:border-white/[0.12]
        rounded-2xl shadow-2xl dark:shadow-black/40
        py-8 px-6 sm:px-8
      ">
        <Form {...form}>
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-6">
              <SulikoLogo width={90} className="mx-auto" />
            </div>

            {/* Tab switcher */}
            <div className="mb-6 bg-muted rounded-xl p-1 flex w-full">
              <button
                type="button"
                onClick={() => !isLoginMode && toggleAuthMode()}
                className={`cursor-pointer flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  isLoginMode
                    ? "bg-suliko-default-color text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("login")}
              </button>
              <button
                type="button"
                onClick={() => isLoginMode && toggleAuthMode()}
                className={`cursor-pointer flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  !isLoginMode
                    ? "bg-suliko-default-color text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("register")}
              </button>
            </div>

            {/* Subtitle */}
            <div className="pb-5 w-full">
              <p className="text-center text-[0.85rem] lg:text-[0.95rem] text-muted-foreground">
                {isLoginMode ? t("welcomeBack") : t("description")}
              </p>
            </div>

            {/* Registration stepper */}
            {!isLoginMode && (
              <div className="w-full mb-4">
                <RegistrationStepper currentStep={registrationStep} />
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(
                  (data) => { onSubmit(data); },
                  (errors) => { console.log("Form validation failed:", errors); }
                )(e);
              }}
              className="flex flex-col gap-6 w-full"
            >
              {/* LOGIN fields */}
              {isLoginMode && (
                <>
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold dark:text-white">
                          {t("phoneNumberOrEmail") || "Phone Number or Email"}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                            />
                            <Input
                              placeholder={t("phoneNumberOrEmailPlaceholder") || "Enter phone number or email"}
                              className="border-2 shadow-md dark:border-slate-600 pl-9"
                              autoComplete="username"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <PasswordSection
                    form={form}
                    isLoginMode={isLoginMode}
                    onForgotPassword={() => setShowPasswordRecovery(true)}
                  />
                  <Button
                    className="bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {t("pleaseWait") || "Please wait…"}
                      </span>
                    ) : (
                      t("login")
                    )}
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{t("orWithCredentials") || "or"}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <GoogleButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => setAuthError(t("ErrorAlert.ups") || "Error detected")}
                    label={t("orContinueWith") || "Continue with Google"}
                  />
                </>
              )}

              {/* REGISTRATION step 1 — verify */}
              {!isLoginMode && registrationStep === 1 && (
                <>
                  {!verificationMethod && !getRequiredVerificationMethod() && (
                    <div className="flex flex-col gap-4 w-full">
                      <p className="text-center text-base font-medium text-foreground mb-2">
                        {t("chooseVerificationMethod")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <button
                          type="button"
                          onClick={() => setVerificationMethod("phone")}
                          className="group relative flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-suliko-default-color transition-[border-color,box-shadow] duration-200 hover:shadow-md bg-card cursor-pointer"
                        >
                          <div className="text-4xl mb-3">📱</div>
                          <div className="text-lg font-semibold text-foreground mb-1">
                            {t("verifyWithPhone")}
                          </div>
                          <div className="text-xs text-center text-muted-foreground">
                            {t("phoneVerificationDescription")}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationMethod("email")}
                          className="group relative flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-suliko-default-color transition-[border-color,box-shadow] duration-200 hover:shadow-md bg-card cursor-pointer"
                        >
                          <div className="text-4xl mb-3">📧</div>
                          <div className="text-lg font-semibold text-foreground mb-1">
                            {t("verifyWithEmail")}
                          </div>
                          <div className="text-xs text-center text-muted-foreground">
                            {t("emailVerificationDescription")}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {verificationMethod === "phone" && (
                    <>
                      <PhoneVerificationSection
                        form={form}
                        isLoginMode={false}
                        onPhoneChange={handlePhoneChange}
                        onSendCode={handleSendPhoneCode}
                        isCodeSent={isCodeSent}
                        isSendingCode={isSendingCode}
                        resendTimer={resendTimer}
                        onResendCode={handleResendCode}
                        isCodeVerified={isCodeVerified}
                        sentVerificationCode={sentVerificationCode}
                      />
                      {!isCodeSent && !getRequiredVerificationMethod() && (
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationMethod(null);
                            form.setValue("mobile", "");
                          }}
                          className="text-sm text-muted-foreground hover:text-suliko-default-color transition-colors underline"
                        >
                          {t("changeVerificationMethod")}
                        </button>
                      )}
                    </>
                  )}

                  {verificationMethod === "email" && (
                    <>
                      <EmailVerificationSection
                        form={form}
                        onEmailChange={handleEmailChange}
                        onSendCode={handleSendEmailCode}
                        isCodeSent={isCodeSent}
                        isSendingCode={isSendingCode}
                        resendTimer={resendTimer}
                        onResendCode={handleResendCode}
                        isCodeVerified={isCodeVerified}
                        sentVerificationCode={sentVerificationCode}
                      />
                      {!isCodeSent && !getRequiredVerificationMethod() && (
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationMethod(null);
                            form.setValue("email", "");
                          }}
                          className="text-sm text-muted-foreground hover:text-suliko-default-color transition-colors underline"
                        >
                          {t("changeVerificationMethod")}
                        </button>
                      )}
                    </>
                  )}

                  <Button
                    type="button"
                    className="bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
                    disabled={!isCodeVerified}
                    onClick={handleContinueStep1}
                  >
                    {t("continue") || "Continue"}
                  </Button>
                </>
              )}

              {/* REGISTRATION step 2 — personal info */}
              {!isLoginMode && registrationStep === 2 && (
                <>
                  <NameSection form={form} hideEmail={verificationMethod === "email"} />
                  {verificationMethod === "email" && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {t("phoneWillBeAskedLater")}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setRegistrationStep(1)}
                    >
                      {t("back") || "Back"}
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
                      onClick={handleContinueStep2}
                    >
                      {t("continue") || "Continue"}
                    </Button>
                  </div>
                </>
              )}

              {/* REGISTRATION step 3 — password + terms + submit */}
              {!isLoginMode && registrationStep === 3 && (
                <>
                  <PasswordSection form={form} isLoginMode={false} />
                  <TermsSection form={form} />
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setRegistrationStep(2)}
                    >
                      {t("back") || "Back"}
                    </Button>
                    <Button
                      className="flex-1 bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          {t("pleaseWait") || "Please wait…"}
                        </span>
                      ) : (
                        t("register")
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </Form>
      </div>{/* end acrylic card */}

      <PasswordRecoveryModal
        isOpen={showPasswordRecovery}
        onClose={() => setShowPasswordRecovery(false)}
      />
    </>
  );
};

export default SulikoForm;
