import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { requireUser } from "@/lib/auth-helpers";
import { getOwnedBooking, PaymentError } from "@/lib/payments";
import { formatIDR } from "@/lib/format";
import styles from "./confirmation.module.css";

export const metadata: Metadata = { title: "Booking confirmation — Luxury Stays" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const VIEWS = {
  paid: {
    badge: styles.badgePaid,
    icon: "✓",
    title: "Booking confirmed",
    subtitle: "Your payment was received. We can't wait to host you.",
  },
  pending: {
    badge: styles.badgePending,
    icon: "⏳",
    title: "Awaiting payment",
    subtitle: "Your booking is held. Complete payment to confirm it.",
  },
  failed: {
    badge: styles.badgeFailed,
    icon: "✕",
    title: "Payment unsuccessful",
    subtitle: "This booking was not paid and has been released.",
  },
} as const;

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const slug = typeof sp.h === "string" ? sp.h : undefined;
  if (!slug) notFound();

  let data;
  try {
    data = await getOwnedBooking(slug, id, user.id);
  } catch (error) {
    if (error instanceof PaymentError) notFound();
    throw error;
  }
  const { listing, booking } = data;

  const view =
    booking.paymentStatus === "paid"
      ? VIEWS.paid
      : booking.paymentStatus === "failed"
        ? VIEWS.failed
        : VIEWS.pending;

  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className={`container ${styles.page}`}>
      <div className={`${styles.badge} ${view.badge}`}>{view.icon}</div>
      <h1 className={styles.title}>{view.title}</h1>
      <p className={styles.subtitle}>{view.subtitle}</p>

      <Card className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Hotel</span>
          <span>{listing.name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Room</span>
          <span>{booking.room.type}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Dates</span>
          <span>
            {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Booking reference</span>
          <span>{booking.id}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Total</span>
          <span>{formatIDR(booking.totalAmount)}</span>
        </div>
      </Card>

      <div className={styles.actions}>
        {booking.paymentStatus !== "paid" && booking.status !== "cancelled" && (
          <Button href={`/checkout/${booking.id}?h=${encodeURIComponent(slug)}`}>
            Complete payment
          </Button>
        )}
        <Button href="/hotels" variant="outline">
          Browse more hotels
        </Button>
      </div>
    </div>
  );
}
