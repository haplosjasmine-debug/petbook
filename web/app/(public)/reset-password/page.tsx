import { redirect } from "next/navigation";

export const metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  redirect("/forgot-password");
}
