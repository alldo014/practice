"use client";

import { useState } from "react";
import Button from "@/components/Button";
import styles from "./checkout.module.css";

export default function PayButton({ bookingId, slug }: { bookingId: string; slug: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        setPending(false);
        return;
      }
      // May be an external Xendit URL — use a full navigation.
      window.location.href = data.redirectUrl;
    } catch {
      setError("Network error. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className={styles.actions}>
      {error && <p className={styles.error}>{error}</p>}
      <Button type="button" block onClick={handlePay} disabled={pending}>
        {pending ? "Starting secure checkout…" : "Pay with Xendit"}
      </Button>
    </div>
  );
}
