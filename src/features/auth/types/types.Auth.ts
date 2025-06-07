import { z } from "zod";

export const loginFormSchema = z.object({
  mobile: z.string()
    .min(1, "Phone number is required")
    .regex(/^5\d{8}$/, "Phone number must be in Georgian format: 5XXXXXXXX"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, "Password must contain at least one number and one symbol"),
});

export const registerFormSchema = z.object({
  mobile: z.string()
    .min(1, "Phone number is required")
    .regex(/^5\d{8}$/, "Phone number must be in Georgian format: 5XXXXXXXX"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, "Password must contain at least one number and one symbol"),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  verificationCode: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;

export interface SendVerificationCodeResponse {
  code: number;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
} 