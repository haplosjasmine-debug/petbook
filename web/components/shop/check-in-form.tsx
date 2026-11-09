"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CheckInForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      appointment?: { id: number };
    };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to check in.");
      return;
    }

    toast.success("Checked in.");
    setCode("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="check-in-code">Booking code</Label>
        <Input
          id="check-in-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="PB-XXXX-XXXX"
          className="font-mono uppercase"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
        {loading ? "Checking in…" : "Check in"}
      </Button>
    </form>
  );
}
