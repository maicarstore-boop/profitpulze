import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log In — ProfitPulze",
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Log in to access your portfolio and markets.">
      <LoginForm />
    </AuthShell>
  );
}
