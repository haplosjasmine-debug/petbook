import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="page-shell py-16">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">We're here to help</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Questions about booking, payments, or partnering with PetBook? Send us a message and a
            real person will get back to you.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Mail, label: "Email", value: "hello@petbook.io" },
              { icon: Phone, label: "Phone", value: "+63 2 8555 0100" },
              { icon: MapPin, label: "Office", value: "Quezon City, Philippines" },
              { icon: Clock, label: "Hours", value: "Mon–Sat, 9:00 AM – 6:00 PM" },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-brand-50 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-brand-800">
              <MessageCircle className="h-4 w-4" /> For urgent appointment changes
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-800/70">
              Please contact your shop directly from the appointment page. Shop contact details are
              included in every booking confirmation.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-black">Send a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in the form and we'll reply within one business day.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
