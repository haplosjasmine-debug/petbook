import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <section className="page-shell py-14">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Reset your password</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Enter the email you use for PetBook. We will send a 6-digit code, then you can choose a
          new password.
        </p>
      </div>

      <Card className="mx-auto mt-8 w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </section>
  );
}
