"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form } from "@/features/ui/components/ui/form";
import { Button } from "@/features/ui/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import SulikoFormParticles from "./SulikoFormParticles";
import {
  register,
  login,
  sendCode,
} from "@/features/auth/services/authorizationService";
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
import {
  createLoginFormSchema,
  createRegisterFormSchema,
  LoginFormData,
  RegisterFormData,
} from "@/features/auth/types/types.Auth";

const SulikoForm: React.FC = () => {
  const t = useTranslations("Authorization");
  const locale = useLocale();
  const router = useRouter();
  const { setToken, setRefreshToken, triggerWelcomeModal } = useAuthStore();
  const fetchUserProfile = useUserStore((state) => state.fetchUserProfile);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
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

  // Automatically set verification method based on domain when switching to registration mode
  useEffect(() => {
    if (!isLoginMode) {
      const requiredMethod = getRequiredVerificationMethod();
      if (requiredMethod && !verificationMethod) {
        setVerificationMethod(requiredMethod);
      }
    }
  }, [isLoginMode, verificationMethod]);

  function toggleAuthMode() {
    const newIsLoginMode = !isLoginMode;
    setIsLoginMode(newIsLoginMode);
    setAuthError(null);
    setIsCodeSent(false);
    setIsSendingCode(false);
    setResendTimer(0);
    setSentVerificationCode("");
    setIsCodeVerified(false);
    
    // Set verification method based on domain when switching to registration
    if (!newIsLoginMode) {
      const requiredMethod = getRequiredVerificationMethod();
      setVerificationMethod(requiredMethod);
      
      // Track when user starts registration process
      trackRegistrationStart();
      // Also send server-side event
      trackRegistrationStartServerEvent();
    } else {
      setVerificationMethod(null);
    }
  }

  async function handleSendPhoneCode() {
    const mobile = form.getValues("mobile");
    const valid = await form.trigger("mobile");
    if (!valid) return;

    // Ensure we have a valid phone number
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
      setAuthError(error instanceof Error ? error.message : t("sendCodeError"));
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleSendEmailCode() {
    const email = form.getValues("email");
    const valid = await form.trigger("email");
    if (!valid) return;

    // Ensure we have a valid email
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
      setAuthError(error instanceof Error ? error.message : t("sendCodeError"));
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

  async function onSubmit(values: LoginFormData | RegisterFormData) {
    setAuthError(null);
    try {
      if (isLoginMode) {
        const loginValues = values as LoginFormData;
        const data = await login({
          phoneNumber: loginValues.mobile,
          password: loginValues.password,
        });
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        triggerWelcomeModal();
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

        // Determine which field was verified and which is optional
        const phoneNumber = verificationMethod === "phone" ? registerValues.mobile : undefined;
        const email = verificationMethod === "email" ? registerValues.email : undefined;

        // At least one must be provided
        if (!phoneNumber && !email) {
          setAuthError("Either phone number or email must be verified");
          return;
        }

        const data = await register({
          phoneNumber: phoneNumber || "",
          password: registerValues.password,
          firstname: registerValues.firstname || generateDefaultName(),
          lastname: registerValues.lastname || "",
          email: email || "",
          verificationCode: registerValues.verificationCode,
          subscribeNewsletter: registerValues.subscribeNewsletter,
        } as RegisterParams);
        
        // Track successful registration
        trackRegistrationComplete({
          phoneNumber: phoneNumber || "",
          firstName: registerValues.firstname || generateDefaultName(),
          lastName: registerValues.lastname || ""
        });
        
        // Also send server-side event for more reliable tracking
        await trackRegistrationServerEvent({
          phone: phoneNumber || "",
          firstName: registerValues.firstname || generateDefaultName(),
          lastName: registerValues.lastname || ""
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

      if (!isLoginMode && errorMessage.includes("უკვე რეგისტრირებულია")) {
        setAuthError(`${errorMessage}`);
      } else if (isLoginMode && errorMessage.includes("ვერ მოიძებნა")) {
        setAuthError(`${errorMessage}`);
        setTimeout(() => {
          setIsLoginMode(false);
          setAuthError(null);
          form.reset();
        }, 2000);
      } else {
        setAuthError(errorMessage);
      }
    }
  }

  const handlePhoneChange = () => {
    if (isCodeSent && verificationMethod === "phone") {
      setIsCodeSent(false);
      setIsCodeVerified(false);
      setSentVerificationCode("");
      setResendTimer(0);
      // Only reset verification method if not required by domain
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
      // Only reset verification method if not required by domain
      const requiredMethod = getRequiredVerificationMethod();
      if (!requiredMethod) {
        setVerificationMethod(null);
      }
      form.setValue("verificationCode", "");
    }
  };

  return (
    <>
      <SulikoFormParticles />
      {authError && (
        <ErrorAlert
          message={authError}
          onClose={() => setAuthError(null)}
        />
      )}
      <div className="w-[85%] dark:z-[2] dark:bg-transparent bg-suliko-main-content-bg-color z-[100] pt-[100px]">
        <Form {...form}>
          <div className="flex z-10 flex-col my-[110px] sm:mt-0 justify-center items-center w-full h-full">
            <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex w-[60%] max-w-md">
              <button
                type="button"
                onClick={() => !isLoginMode && toggleAuthMode()}
                className={`cursor-pointer flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLoginMode
                    ? "bg-suliko-default-color text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                }`}
              >
                {t("login")}
              </button>
              <button
                type="button"
                onClick={() => isLoginMode && toggleAuthMode()}
                className={`cursor-pointer flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLoginMode
                    ? "bg-suliko-default-color text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                }`}
              >
                {t("register")}
              </button>
            </div>

            <div className="pb-[20px] lg:pb-[40px] flex flex-col gap-5 overflow-hidden">
              <h3 className="lg:text-4xl text-2xl text-suliko-default-color font-bold text-center dark:text-primary">
                {isLoginMode ? t("login") : t("register")}
              </h3>
              <p className="text-center px-[10px] text-[0.8rem] lg:text-[1rem] dark:text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(
                  (data) => {
                    onSubmit(data);
                  },
                  (errors) => {
                    console.log('Form validation failed:', errors);
                  }
                )(e);
              }}
              className="flex flex-col gap-8 w-[60%]"
            >
              {isLoginMode ? (
                <PhoneVerificationSection
                  form={form}
                  isLoginMode={isLoginMode}
                  onPhoneChange={handlePhoneChange}
                  onSendCode={handleSendPhoneCode}
                  isCodeSent={isCodeSent}
                  isSendingCode={isSendingCode}
                  resendTimer={resendTimer}
                  onResendCode={handleResendCode}
                  isCodeVerified={isCodeVerified}
                  sentVerificationCode={sentVerificationCode}
                />
              ) : (
                <>
                  {!verificationMethod && !getRequiredVerificationMethod() && (
                    <div className="flex flex-col gap-4 w-full">
                      <p className="text-center text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("chooseVerificationMethod")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <button
                          type="button"
                          onClick={() => setVerificationMethod("phone")}
                          className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-suliko-default-color dark:hover:border-suliko-default-color transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800 cursor-pointer"
                        >
                          <div className="text-4xl mb-3">📱</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t("verifyWithPhone")}
                          </div>
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            {t("phoneVerificationDescription")}
                          </div>
                          <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-suliko-default-color transition-all duration-200"></div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationMethod("email")}
                          className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-suliko-default-color dark:hover:border-suliko-default-color transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800 cursor-pointer"
                        >
                          <div className="text-4xl mb-3">📧</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t("verifyWithEmail")}
                          </div>
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            {t("emailVerificationDescription")}
                          </div>
                          <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-suliko-default-color transition-all duration-200"></div>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {verificationMethod === "phone" && (
                    <>
                      <PhoneVerificationSection
                        form={form}
                        isLoginMode={isLoginMode}
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
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-suliko-default-color dark:hover:text-suliko-default-color transition-colors underline"
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
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-suliko-default-color dark:hover:text-suliko-default-color transition-colors underline"
                        >
                          {t("changeVerificationMethod")}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {!isLoginMode && (
                <>
                  <NameSection form={form} hideEmail={verificationMethod === "email"} />
                  {verificationMethod === "phone" && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {t("emailWillBeAskedLater")}
                      </p>
                    </div>
                  )}
                  {verificationMethod === "email" && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {t("phoneWillBeAskedLater")}
                      </p>
                    </div>
                  )}
                </>
              )}

              <PasswordSection
                form={form}
                isLoginMode={isLoginMode}
                isPasswordVisible={isPasswordVisible}
                setIsPasswordVisible={setIsPasswordVisible}
              />

              {!isLoginMode && <TermsSection form={form} />}

              <Button
                className="bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
                type="submit"
              >
                {isLoginMode ? t("login") : t("register")}
              </Button>

              {isLoginMode && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowPasswordRecovery(true)}
                    className="text-sm text-suliko-default-color hover:underline cursor-pointer"
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
              )}
            </form>
          </div>
        </Form>
      </div>
      
      <PasswordRecoveryModal
        isOpen={showPasswordRecovery}
        onClose={() => setShowPasswordRecovery(false)}
      />
    </>
  );
};

export default SulikoForm;
