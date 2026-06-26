import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { requireUser } from "@/lib/auth-helpers";
import { getOwnedBooking, PaymentError, isXenditConfigured } from "@/lib/payments";
import { formatIDR } from "@/lib/format";
import { simulatePayment } from "./actions";
import styles from "../checkout.module.css";

export const metadata: Metadata = { title: "Mock payment — Luxury Stays" };

type Params = Promise<{ bookingId: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MockCheckoutPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  // The mock only exists when no real Xendit key is set.
  if (isXenditConfigured()) notFound();

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

  return (
    <div className={`container ${styles.page}`}>
      <p className="eyebrow">Mock Xendit Checkout</p>
      <h1 className={styles.title}>Simulate a payment</h1>
      <p className={styles.devBanner}>
        This stands in for the Xendit hosted invoice page while no live key is configured. Add a
        real <code>XENDIT_SECRET_KEY</code> to use the real provider.
      </p>

      <Card className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>{listing.name}</span>
          <span>{booking.room.type}</span>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.label}>Amount due</span>
          <strong>{formatIDR(booking.totalAmount)}</strong>
        </div>

        <div className={styles.actions} style={{ display: "flex", gap: 12 }}>
          <form action={simulatePayment} style={{ flex: 1 }}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="outcome" value="paid" />
            <Button type="submit" block>
              Simulate successful payment
            </Button>
          </form>
          <form action={simulatePayment} style={{ flex: 1 }}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="outcome" value="failed" />
            <Button type="submit" variant="outline" block>
              Simulate failure
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
