"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/ui/components/ui/form";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useState, useMemo } from "react";
import SulikoFormParticles from "./SulikoFormParticles";
import { register, login } from "@/features/auth/services/authorizationService";
import type { RegisterParams } from "@/features/auth/services/authorizationService";
import ErrorAlert from "./ErrorAlert";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { generateDefaultName } from "@/shared/utils/generateDefaultName";

const SulikoForm: React.FC = () => {
  const t = useTranslations('Authorization');
  const { setToken, setRefreshToken } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const formSchema = useMemo(() => z.object({
    mobile: z
      .string()
      .min(1, { message: t('phoneNumberRequiredError') })
      .regex(/^5\d{8}$/, { message: t('phoneNumberFormatError') }),
    password: z
      .string()
      .min(8, { message: t('passwordMinLengthError') })
      .regex(
        /(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        { message: t('passwordRegexError') }
      ),
    name: z.string().optional(),
    surname: z.string().optional(),
  }), [t]);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: "",
      password: "",
      name: "",
      surname: "",
    },
  });
  const router = useRouter();

  function togglePasswordVisibility() {
    setIsPasswordVisible((prev) => !prev);
  }

  function toggleAuthMode() {
    setIsLoginMode((prev) => !prev);
    setAuthError(null);
    form.reset();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setAuthError(null);
    try {
      if (isLoginMode) {
        const data = await login({
          phoneNumber: values.mobile,
          password: values.password,
        });
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        router.push("/");
      } else {
        let name = values.name;
        let surname = values.surname;
        if (!name) name = generateDefaultName();
        if (!surname) surname = generateDefaultName();
        const data = await register({
          phoneNumber: values.mobile,
          password: values.password,
          name,
          surname,
        } as RegisterParams);
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        router.push("/");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed, Invalid credentials";
      
      if (!isLoginMode && errorMessage.includes("უკვე რეგისტრირებულია")) {
        setAuthError(`${errorMessage}. ${t('switchToLoginRecommended')}`);
      } else if (isLoginMode && errorMessage.includes("ვერ მოიძებნა")) {
        setAuthError(`${errorMessage}. ${t('switchingToRegistrationMode')}`);
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

  return (
    <>
      <SulikoFormParticles />
      {authError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-top-2 duration-300">
          <ErrorAlert
            message={authError}
            onClose={() => setAuthError(null)}
            timeout={3000}
          />
        </div>
      )}
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
              {t('login')}
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
              {t('register')}
            </button>
          </div>

          <div className="pb-[20px] lg:pb-[40px] flex flex-col gap-5 overflow-hidden">
            <h3 className="lg:text-4xl text-2xl text-suliko-default-color font-bold text-center dark:text-primary">
              {isLoginMode ? t('login') : t('register')}
            </h3>
            <p className="text-center px-[10px] text-[0.8rem] lg:text-[1rem] dark:text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-8 w-[60%]"
          >
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold dark:text-white">{t('phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input placeholder="5XX 11 22 33" className="border-2 shadow-md dark:border-slate-600" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold dark:text-white">{t('password')}</FormLabel>
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        className="border-2 shadow-md dark:border-slate-600"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                      {isPasswordVisible ? (
                        <Eye
                          size={25}
                          className="absolute cursor-pointer right-0 top-[50%] translate-[-50%]"
                          onClick={togglePasswordVisibility}
                        />
                      ) : (
                        <EyeOff
                          size={25}
                          className="absolute cursor-pointer right-0 top-[50%] translate-[-50%]"
                          onClick={togglePasswordVisibility}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isLoginMode && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold dark:text-white">{t('name')} ({t('optional')})</FormLabel>
                      <FormControl>
                        <Input placeholder={t('namePlaceholder')} className="border-2 shadow-md dark:border-slate-600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold dark:text-white">{t('surname')} ({t('optional')})</FormLabel>
                      <FormControl>
                        <Input placeholder={t('surnamePlaceholder')} className="border-2 shadow-md dark:border-slate-600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Button
              className="bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
              type="submit"
            >
              {isLoginMode ? t('login') : t('register')}
            </Button>
          </form>
        </div>
      </Form>
    </>
  );
};

export default SulikoForm;
