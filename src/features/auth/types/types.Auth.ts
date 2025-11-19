import { z } from "zod";

export const createLoginFormSchema = (t: (key: string) => string, locale?: string) => z.object({
  identifier: z.string()
    .min(1, t("phoneNumberOrEmailRequired") || "Phone number or email is required")
    .refine(
      (val) => {
        const trimmed = val.trim();
        // Check if it's a valid email
        const isEmail = z.string().email().safeParse(trimmed).success;
        // Check if it's a valid phone number
        const isPhone = locale === 'pl' 
          ? /^(\+48)?[1-9]\d{8}$/.test(trimmed.replace(/\s+/g, ''))
          : /^5\d{8}$/.test(trimmed.replace(/\s+/g, ''));
        return isEmail || isPhone;
      },
      { message: t("phoneNumberOrEmailFormatError") || "Please enter a valid phone number or email address" }
    ),
  password: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
});

export const createRegisterFormSchema = (t: (key: string) => string, locale?: string) => z.object({
  mobile: z.string()
    .optional()
    .refine(
      (val) => !val || (locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/.test(val) : /^5\d{8}$/.test(val)),
      { message: t("phoneNumberFormatError") }
    ),
  password: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      { message: t("emailFormatError") }
    ),
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

export interface PasswordRecoveryRequest {
  phoneNumber: string;
}

export interface PasswordRecoveryResponse {
  success: boolean;
  message: string;
}

export interface ValidateRecoveryCodeRequest {
  phoneNumber: string;
  code: string;
}

export interface ValidateRecoveryCodeResponse {
  success: boolean;
  message: string;
  token?: string; // Token for password reset
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  newPassword: string;
  token: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
} 