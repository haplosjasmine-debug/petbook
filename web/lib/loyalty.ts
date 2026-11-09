import { appConfig } from "@/lib/config";
import { roundMoney } from "@/lib/commission";

export function pointsForAmount(amount: number | string) {
  const value = Number(amount) || 0;
  return Math.floor((value / 100) * appConfig.loyaltyPointsPerHundred);
}

export function pointsValue(points: number) {
  return roundMoney(Math.max(0, points) * appConfig.loyaltyPointValue);
}

export function minimumRedemption() {
  return 50;
}
