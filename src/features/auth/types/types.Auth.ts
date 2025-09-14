import { z } from "zod";

export const createLoginFormSchema = (t: (key: string) => string, locale?: string) => z.object({
  mobile: z.string()
    .min(1, t("phoneNumberRequiredError"))
    .regex(
      locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/ : /^5\d{8}$/, 
      t("phoneNumberFormatError")
    ),
  password: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
});

export const createRegisterFormSchema = (t: (key: string) => string, locale?: string) => z.object({
  mobile: z.string()
    .min(1, t("phoneNumberRequiredError"))
    .regex(
      locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/ : /^5\d{8}$/, 
      t("phoneNumberFormatError")
    ),
  password: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
  verificationCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: t("acceptTermsAndConditionsError"),
  }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: t("acceptPrivacyPolicyError"),
  }),
  subscribeNewsletter: z.boolean().optional(),
});

export type LoginFormData = z.infer<ReturnType<typeof createLoginFormSchema>>;
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterFormSchema>>;

export interface SendVerificationCodeResponse {
  code: number;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
} 