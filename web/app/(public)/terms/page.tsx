export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <section className="page-shell max-w-3xl py-16">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Terms of service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-black text-foreground">Using PetBook</h2>
          <p className="mt-2">
            PetBook is a booking and record-keeping platform that connects pet owners with
            independent pet care businesses. You must provide accurate information and use the
            platform lawfully.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Bookings and payments</h2>
          <p className="mt-2">
            Bookings are between you and the selected business. PetBook facilitates scheduling,
            reminders, and payment. Online payments are processed by PayMongo. A 10% platform
            commission applies to completed bookings and is deducted from the business payout.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Cancellations</h2>
          <p className="mt-2">
            Cancellation windows and fees are set by each business. Please review the shop's policy
            before booking. PetBook may cancel bookings affected by fraud, abuse, or technical
            errors.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Business responsibilities</h2>
          <p className="mt-2">
            Partner businesses are responsible for the care they provide, their licences, staff
            qualifications, and compliance with applicable laws. Businesses must keep service
            prices, availability, and contact details accurate.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Loyalty points</h2>
          <p className="mt-2">
            Loyalty points have no cash value, may expire according to program rules, and may be
            adjusted to correct errors or abuse.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Limitation of liability</h2>
          <p className="mt-2">
            PetBook is not a veterinary provider and is not responsible for the acts or omissions of
            independent businesses. To the extent permitted by law, PetBook's liability is limited to
            the fees it earned on the affected booking.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Contact</h2>
          <p className="mt-2">Questions about these terms? Email hello@petbook.io.</p>
        </section>
      </div>
    </section>
  );
}
