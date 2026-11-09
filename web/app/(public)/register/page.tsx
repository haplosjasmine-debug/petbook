import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params.role === "shop_owner" ? "shop_owner" : "customer";

  return (
    <section className="page-shell py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Get started</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          Join the PetBook community
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Create a free account to book care, track records, and stay on top of every reminder.
        </p>
      </div>

      <Card className="mx-auto mt-8 max-w-2xl">
        <CardContent className="p-6 sm:p-8">
          <RegisterForm initialRole={initialRole} />
        </CardContent>
      </Card>
    </section>
  );
}
