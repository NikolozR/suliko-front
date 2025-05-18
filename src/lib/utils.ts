import { clsx, type ClassValue } from "clsx"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function signIn(router: AppRouterInstance) {
  router.push("/sign-up");
}

export function signUp(router: AppRouterInstance) {
  router.push("/sign-up");
}