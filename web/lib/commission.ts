import { appConfig } from "@/lib/config";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateCommission(
  amount: number | string,
  rate: number | string = appConfig.commissionRate
) {
  const gross = roundMoney(Number(amount) || 0);
  const percentage = Math.min(Math.max(Number(rate) || 0, 0), 100);
  const commission = roundMoney((gross * percentage) / 100);
  return {
    amount: gross,
    commissionRate: percentage,
    commissionAmount: commission,
    netAmount: roundMoney(gross - commission),
  };
}

export function commissionLabel(rate: number | string = appConfig.commissionRate) {
  return `${Number(rate)}%`;
}
