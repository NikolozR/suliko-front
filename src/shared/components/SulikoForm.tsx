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
import { register } from "@/features/auth/services/authorizationService";
import ErrorAlert from "./ErrorAlert";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  }), [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });
  const router = useRouter();

  function togglePasswordVisibility() {
    setIsPasswordVisible((prev) => !prev);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setAuthError(null);
    try {
      const data = await register({
        phoneNumber: values.mobile,
        password: values.password,
      });
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      router.push("/");
    } catch {
      setAuthError(t('AuthenticationFailed'));
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
          <div className="pb-[20px] lg:pb-[40px] flex flex-col gap-5 overflow-hidden">
            <h3 className="lg:text-4xl text-2xl text-suliko-default-color font-bold text-center dark:text-primary">
              {t('title')}
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
            <Button
              className="bg-suliko-default-color cursor-pointer hover:bg-suliko-default-hover-color dark:text-white"
              type="submit"
            >
              {t('register')}
            </Button>
          </form>
        </div>
      </Form>
    </>
  );
};

export default SulikoForm;
