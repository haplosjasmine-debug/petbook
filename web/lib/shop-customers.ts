import { createItem, listItems } from "@/lib/directus";
import type { ShopCustomer } from "@/lib/types";

export async function ensureShopCustomer(shopId: number, customerId: number) {
  const existing = await listItems<ShopCustomer>(
    "shop_customers",
    `filter[shop][_eq]=${shopId}&filter[customer][_eq]=${customerId}&limit=1`
  );
  if (existing[0]) return existing[0];

  return createItem<ShopCustomer>("shop_customers", {
    shop: shopId,
    customer: customerId,
  });
}
