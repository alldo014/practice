import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import { requireRole } from "@/lib/auth-helpers";
import { listOwnerBookings, type BookingStatusFilter } from "@/lib/owner-bookings";
import { formatIDR } from "@/lib/format";
import CancelBookingButton from "./CancelBookingButton";
import consoleStyles from "@/components/console.module.css";
import styles from "./bookings.module.css";

export const metadata: Metadata = { title: "Bookings — Dashboard" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const FILTERS: { label: string; value?: BookingStatusFilter }[] = [
  { label: "All" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function badge(status: string, paymentStatus: string) {
  if (status === "cancelled") return { label: "Cancelled", cls: styles.bCancelled };
  if (paymentStatus === "paid") return { label: "Confirmed · paid", cls: styles.bConfirmed };
  if (paymentStatus === "failed") return { label: "Payment failed", cls: styles.bCancelled };
  return { label: "Pending payment", cls: styles.bPending };
}

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireRole("tenant_owner");
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : undefined;
  const status = (["pending", "confirmed", "cancelled"] as const).find((s) => s === raw);

  const { bookings } = await listOwnerBookings(user.tenantId!, status);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <p className="eyebrow">Reservations</p>
      <h1 className={consoleStyles.h1}>Bookings</h1>
      <p className={consoleStyles.lede}>{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p>

      <div className={styles.filters}>
        {FILTERS.map((f) => {
          const active = (f.value ?? undefined) === status;
          const href = f.value ? `/dashboard/bookings?status=${f.value}` : "/dashboard/bookings";
          return (
            <Link
              key={f.label}
              href={href}
              className={`${styles.filter} ${active ? styles.filterActive : ""}`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <div className={consoleStyles.empty}>No bookings to show.</div>
      ) : (
        <div className={styles.list}>
          {bookings.map((b) => {
            const bg = badge(b.status, b.paymentStatus);
            const checkOut = fmtDate(b.checkOut);
            const past = checkOut < today;
            return (
              <Card key={b.id} className={styles.booking}>
                <div>
                  <div className={styles.guest}>{b.guestEmail}</div>
                  <div className={styles.meta}>
                    {b.room.type} · {fmtDate(b.checkIn)} → {checkOut} · {b.guests} guest
                    {b.guests > 1 ? "s" : ""}
                  </div>
                  <div className={styles.when}>{past ? "Past stay" : "Upcoming"}</div>
                </div>
                <div className={styles.right}>
                  <div className={styles.badges}>
                    <span className={`${styles.badge} ${bg.cls}`}>{bg.label}</span>
                    <span className={styles.amount}>{formatIDR(b.totalAmount)}</span>
                  </div>
                  {b.status !== "cancelled" && <CancelBookingButton bookingId={b.id} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
