import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Card from "@/components/Card";
import { requireUser } from "@/lib/auth-helpers";
import { getOwnedBooking, PaymentError, isXenditConfigured } from "@/lib/payments";
import { formatIDR } from "@/lib/format";
import PayButton from "./PayButton";
import styles from "./checkout.module.css";

export const metadata: Metadata = { title: "Checkout — Luxury Stays" };

type Params = Promise<{ bookingId: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const MS_PER_DAY = 86_400_000;

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const { bookingId } = await params;
  const sp = await searchParams;
  const slug = typeof sp.h === "string" ? sp.h : undefined;
  if (!slug) notFound();

  let data;
  try {
    data = await getOwnedBooking(slug, bookingId, user.id);
  } catch (error) {
    if (error instanceof PaymentError) notFound();
    throw error;
  }
  const { listing, booking } = data;

  if (booking.paymentStatus === "paid") {
    redirect(`/bookings/${booking.id}/confirmation?h=${encodeURIComponent(slug)}`);
  }

  const nights = Math.max(
    1,
    Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / MS_PER_DAY),
  );
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className={`container ${styles.page}`}>
      <p className="eyebrow">{listing.name}</p>
      <h1 className={styles.title}>Review &amp; pay</h1>

      {!isXenditConfigured() && (
        <p className={styles.devBanner}>
          Dev mode: no live Xendit key configured — checkout uses a local mock payment page.
        </p>
      )}

      <Card className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Room</span>
          <span>{booking.room.type}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Dates</span>
          <span>
            {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} ({nights} night{nights > 1 ? "s" : ""})
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Guests</span>
          <span>{booking.guests}</span>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.label}>Total</span>
          <strong>{formatIDR(booking.totalAmount)}</strong>
        </div>

        <PayButton bookingId={booking.id} slug={slug} />
      </Card>

      <p className={styles.note}>
        <Link href={`/hotels/${slug}`}>← Back to hotel</Link>
      </p>
    </div>
  );
}
