import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
