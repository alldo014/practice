import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { listAllBookings } from "@/lib/admin";
import { formatIDR } from "@/lib/format";
import consoleStyles from "@/components/console.module.css";
import styles from "./bookings.module.css";

export const metadata: Metadata = { title: "All bookings — Admin" };
export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function statusBadge(status: string, paymentStatus: string) {
  if (status === "cancelled") return { label: "Cancelled", cls: styles.cancelled };
  if (paymentStatus === "paid") return { label: "Paid", cls: styles.paid };
  if (paymentStatus === "failed") return { label: "Failed", cls: styles.cancelled };
  return { label: "Pending", cls: styles.pending };
}

export default async function AdminBookingsPage() {
  await requireRole("admin");
  const bookings = await listAllBookings();

  return (
    <>
      <p className="eyebrow">Platform admin</p>
      <h1 className={consoleStyles.h1}>All bookings</h1>
      <p className={consoleStyles.lede}>
        {bookings.length} booking{bookings.length === 1 ? "" : "s"} across every hotel
      </p>

      {bookings.length === 0 ? (
        <div className={consoleStyles.empty}>No bookings yet.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hotel</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const badge = statusBadge(b.status, b.paymentStatus);
                return (
                  <tr key={b.id}>
                    <td className={styles.hotel}>
                      <Link href={`/hotels/${b.hotelSlug}`}>{b.hotelName}</Link>
                    </td>
                    <td>{b.guestEmail}</td>
                    <td>{b.roomType}</td>
                    <td>
                      {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className={styles.amount}>{formatIDR(b.totalAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
