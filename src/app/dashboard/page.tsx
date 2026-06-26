import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { getOwnerDashboard } from "@/lib/dashboard";
import styles from "@/components/console.module.css";

export const metadata: Metadata = { title: "Dashboard — Luxury Stays" };
export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await requireRole("tenant_owner");
  const data = await getOwnerDashboard(user.tenantId);

  if (!data || !data.hotel) {
    return (
      <>
        <h1 className={styles.h1}>Dashboard</h1>
        <div className={styles.empty}>
          Your account isn&rsquo;t linked to a hotel yet. Contact the platform admin.
        </div>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow">{data.hotel.name}</p>
      <h1 className={styles.h1}>Overview</h1>
      <p className={styles.lede}>
        {data.hotel.city}, {data.hotel.country}
      </p>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{data.roomsCount}</div>
          <div className={styles.statLabel}>Rooms</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{data.bookingsCount}</div>
          <div className={styles.statLabel}>Bookings</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{data.hotel.starRating}★</div>
          <div className={styles.statLabel}>Star rating</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Manage</h2>
      <div className={styles.statGrid}>
        <Link href="/dashboard/hotel" className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 18 }}>Hotel profile →</div>
          <div className={styles.statLabel}>Name, description, amenities</div>
        </Link>
        <Link href="/dashboard/rooms" className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 18 }}>Rooms &amp; rates →</div>
          <div className={styles.statLabel}>Add and edit rooms</div>
        </Link>
        <Link href="/dashboard/bookings" className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 18 }}>Bookings →</div>
          <div className={styles.statLabel}>Incoming reservations</div>
        </Link>
      </div>
    </>
  );
}
