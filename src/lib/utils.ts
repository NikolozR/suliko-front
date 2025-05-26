import { clsx, type ClassValue } from "clsx"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { jwtDecode } from "jwt-decode";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function signIn(router: AppRouterInstance) {
  router.push("/sign-in");
}

export function signUp(router: AppRouterInstance) {
  router.push("/sign-in");
}

export function getUserID(token: string) {
  const decodedToken = jwtDecode(token);
  return decodedToken.sub;
}