import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { requireUser } from "@/lib/auth-helpers";
import { getUserBookings, type UserBooking } from "@/lib/account";
import { formatIDR } from "@/lib/format";
import styles from "./account.module.css";

export const metadata: Metadata = { title: "My bookings — Luxury Stays" };

// Reads live per-tenant data — always render fresh.
export const dynamic = "force-dynamic";

function statusBadge(booking: UserBooking): { label: string; className: string } {
  if (booking.paymentStatus === "paid") {
    return { label: "Confirmed", className: styles.badgePaid };
  }
  if (booking.status === "cancelled" || booking.paymentStatus === "failed") {
    return { label: "Cancelled", className: styles.badgeFailed };
  }
  return { label: "Awaiting payment", className: styles.badgePending };
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function AccountPage() {
  const user = await requireUser();
  const bookings = await getUserBookings(user.id);

  return (
    <div className={`container ${styles.page}`}>
      <p className="eyebrow">Your account</p>
      <h1 className={styles.title}>My bookings</h1>
      <p className={styles.subtitle}>
        Signed in as {user.name ?? user.email}
      </p>

      {bookings.length === 0 ? (
        <div className={styles.empty}>
          <h3>No bookings yet</h3>
          <p>When you book a stay, it will appear here.</p>
          <Button href="/hotels">Browse hotels</Button>
        </div>
      ) : (
        <div className={styles.list}>
          {bookings.map((booking) => {
            const badge = statusBadge(booking);
            const awaitingPayment =
              booking.paymentStatus !== "paid" && booking.status !== "cancelled";
            return (
              <Card key={booking.id} className={styles.booking}>
                <div>
                  <Link href={`/hotels/${booking.hotelSlug}`} className={styles.hotelName}>
                    {booking.hotelName}
                  </Link>
                  <p className={styles.meta}>
                    {booking.roomType} · {booking.city}, {booking.country}
                  </p>
                  <p className={styles.meta}>
                    {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.guests}{" "}
                    guest{booking.guests > 1 ? "s" : ""}
                  </p>
                </div>
                <div className={styles.right}>
                  <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
                  <span className={styles.total}>{formatIDR(booking.totalAmount)}</span>
                  {awaitingPayment ? (
                    <Link
                      href={`/checkout/${booking.id}?h=${encodeURIComponent(booking.hotelSlug)}`}
                      className={styles.payLink}
                    >
                      Complete payment →
                    </Link>
                  ) : (
                    <Link
                      href={`/bookings/${booking.id}/confirmation?h=${encodeURIComponent(booking.hotelSlug)}`}
                      className={styles.payLink}
                    >
                      View details →
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
