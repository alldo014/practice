"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { formatIDR } from "@/lib/format";
import styles from "./BookingForm.module.css";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export default function BookingForm({
  slug,
  roomId,
  capacity,
  basePrice,
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests,
}: {
  slug: string;
  roomId: string;
  capacity: number;
  basePrice: number;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: string;
}) {
  const router = useRouter();
  const [today] = useState(() => toISODate(new Date()));
  const [checkIn, setCheckIn] = useState(() => defaultCheckIn ?? addDaysISO(1));
  const [checkOut, setCheckOut] = useState(() => defaultCheckOut ?? addDaysISO(3));
  const [guests, setGuests] = useState(Number(defaultGuests ?? "2") || 2);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ci = new Date(`${checkIn}T00:00:00Z`).getTime();
    const co = new Date(`${checkOut}T00:00:00Z`).getTime();
    const diff = Math.round((co - ci) / 86_400_000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const total = nights * basePrice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, roomId, checkIn, checkOut, guests }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create your booking.");
        setPending(false);
        return;
      }
      router.push(`/checkout/${data.bookingId}?h=${encodeURIComponent(slug)}`);
    } catch {
      setError("Network error. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="checkIn">Check-in</label>
          <input
            id="checkIn"
            type="date"
            min={today || undefined}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="checkOut">Check-out</label>
          <input
            id="checkOut"
            type="date"
            min={checkIn || today || undefined}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="guests">Guests</label>
          <input
            id="guests"
            type="number"
            min={1}
            max={capacity}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className={styles.totalRow}>
        <span>
          {nights > 0
            ? `${formatIDR(basePrice)} × ${nights} night${nights > 1 ? "s" : ""}`
            : "Select your dates"}
        </span>
        <strong>{nights > 0 ? formatIDR(total) : "—"}</strong>
      </div>

      <Button type="submit" block disabled={pending || nights < 1}>
        {pending ? "Creating booking…" : "Confirm booking"}
      </Button>
    </form>
  );
}
