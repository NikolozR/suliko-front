"use client";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { RegisterParams } from "@/features/auth/services/authorizationService";
import ErrorAlert from "./ErrorAlert";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SendVerificationCodeResponse } from "@/features/auth/types/types.Auth";
import { generateDefaultName } from "@/shared/utils/generateDefaultName";
import PhoneVerificationSection from "./PhoneVerificationSection";
import PasswordSection from "./PasswordSection";
import NameSection from "./NameSection";
import TermsSection from "./TermsSection";
import {
  loginFormSchema,
  registerFormSchema,
  LoginFormData,
  RegisterFormData,
} from "@/features/auth/types/types.Auth";

const SulikoForm: React.FC = () => {
  const t = useTranslations("Authorization");
  const router = useRouter();
  const { setToken, setRefreshToken, triggerWelcomeModal } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [sentVerificationCode, setSentVerificationCode] = useState<string>("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const formSchema = useMemo(
    () =>
      isLoginMode
        ? loginFormSchema
        : registerFormSchema.refine(
            (data) => data.password === data.confirmPassword,
            {
              message: t("passwordsDoNotMatch"),
              path: ["confirmPassword"],
            }
          ),
    [t, isLoginMode]
  );

  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: "",
      password: "",
      firstname: "",
      lastname: "",
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

  function toggleAuthMode() {
    setIsLoginMode((prev) => !prev);
    setAuthError(null);
    setIsCodeSent(false);
    setIsSendingCode(false);
    setResendTimer(0);
    setSentVerificationCode("");
    setIsCodeVerified(false);
  }

  async function handleSendCode() {
    const mobile = form.getValues("mobile");
    const valid = await form.trigger("mobile");
    if (!valid) return;

    setIsSendingCode(true);
    setAuthError(null);

    try {
      const response: SendVerificationCodeResponse = await sendCode(mobile);
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
    await handleSendCode();
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
        router.push("/");
      } else {
        const registerValues = values as RegisterFormData;
        if (!isCodeSent) {
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

        const data = await register({
          phoneNumber: registerValues.mobile,
          password: registerValues.password,
          firstname: registerValues.firstname || generateDefaultName(),
          lastname: registerValues.lastname || "",
          verificationCode: registerValues.verificationCode,
          subscribeNewsletter: registerValues.subscribeNewsletter,
        } as RegisterParams);
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        triggerWelcomeModal();
        router.push("/");
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
    if (isCodeSent) {
      setIsCodeSent(false);
      setIsCodeVerified(false);
      setSentVerificationCode("");
      setResendTimer(0);
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
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-8 w-[60%]"
            >
              <PhoneVerificationSection
                form={form}
                isLoginMode={isLoginMode}
                onPhoneChange={handlePhoneChange}
                onSendCode={handleSendCode}
                isCodeSent={isCodeSent}
                isSendingCode={isSendingCode}
                resendTimer={resendTimer}
                onResendCode={handleResendCode}
                isCodeVerified={isCodeVerified}
                sentVerificationCode={sentVerificationCode}
              />

              {!isLoginMode && <NameSection form={form} />}

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
            </form>
          </div>
        </Form>
      </div>
    </>
  );
};

export default SulikoForm;
