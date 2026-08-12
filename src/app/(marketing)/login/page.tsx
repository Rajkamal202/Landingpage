import type { Metadata } from "next";
import { AuthForm } from "@/components/marketing/auth-form";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <AuthForm mode="login" />;
}
