"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RemoveCustomerButton({
  customerId,
  customerName,
}: {
  customerId: number;
  customerName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (
      !window.confirm(
        `Remove ${customerName} from your customer list? Their PetBook account and records stay intact.`
      )
    ) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/shop/customers/${customerId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to remove the customer.");
      return;
    }

    toast.success("Customer removed from your list.");
    router.push("/shop/customers");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-red-50"
      onClick={remove}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserMinus className="h-4 w-4" />
      )}
      Remove customer
    </Button>
  );
}
