import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign Up — ProfitPulze",
};

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" description="Start trading in minutes — no fees to sign up.">
      <RegisterForm />
    </AuthShell>
  );
}
