export const appConfig = {
  name: "PetBook",
  commissionRate: Number(process.env.COMMISSION_RATE ?? 10),
  loyaltyPointsPerHundred: Number(process.env.LOYALTY_POINTS_PER_HUNDRED ?? 2),
  loyaltyPointValue: Number(process.env.LOYALTY_POINT_VALUE ?? 0.5),
  currency: "PHP",
  timezone: "Asia/Manila",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  smsProvider: process.env.SMS_PROVIDER ?? "mock",
  emailProvider: process.env.EMAIL_PROVIDER ?? "mock",
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  directusUrl: process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055",
  directusPublicUrl:
    process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://127.0.0.1:8055",
};

export function directusAdminUrl() {
  return `${appConfig.directusPublicUrl.replace(/\/$/, "")}/admin`;
}
