export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <section className="page-shell max-w-3xl py-16">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          PetBook collects only the information needed to provide booking, pet record, reminder, and
          payment services. This includes your name, email address, mobile number, pet details,
          appointment history, and transaction records.
        </p>
        <section>
          <h2 className="text-lg font-black text-foreground">How we use your information</h2>
          <p className="mt-2">
            We use your information to create and manage your account, process bookings and
            payments, send appointment reminders, and help partner businesses provide care. We do not
            sell personal information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Who can see your data</h2>
          <p className="mt-2">
            You can see your own profile, pets, appointments, and loyalty history. The shop you book
            with can see the details needed to provide the service. Platform administrators can
            access records for support, fraud prevention, and commission reconciliation.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Payments</h2>
          <p className="mt-2">
            Online payments are processed by PayMongo. PetBook does not store full card numbers.
            Payment references and statuses are stored to reconcile bookings and commissions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Your choices</h2>
          <p className="mt-2">
            You can update your profile, edit your pets, and manage communication preferences from
            your dashboard. To request account deletion, contact hello@petbook.io.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-foreground">Contact</h2>
          <p className="mt-2">
            For privacy questions, email hello@petbook.io. We will respond within a reasonable
            period.
          </p>
        </section>
      </div>
    </section>
  );
}
