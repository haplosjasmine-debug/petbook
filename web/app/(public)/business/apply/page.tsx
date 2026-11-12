import { BusinessApplicationForm } from "@/components/auth/business-application-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Apply as a business" };

export default function BusinessApplicationPage() {
  return (
    <section className="page-shell py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">For pet care businesses</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Apply to join PetBook</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Tell us about your shop. A super admin reviews every application before the business owner
          account and shop workspace are created.
        </p>
      </div>

      <Card className="mx-auto mt-8 max-w-2xl">
        <CardContent className="p-6 sm:p-8">
          <BusinessApplicationForm />
        </CardContent>
      </Card>
    </section>
  );
}
