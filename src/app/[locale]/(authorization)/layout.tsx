import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorization | Suliko",
  description: "Authorization pages for Suliko",
};

export default function AuthorizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 