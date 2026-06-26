import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { getPlatformStats } from "@/lib/admin";
import { formatIDR } from "@/lib/format";
import styles from "@/components/console.module.css";

export const metadata: Metadata = { title: "Admin — Luxury Stays" };
export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await requireRole("admin");
  const stats = await getPlatformStats();

  return (
    <>
      <p className="eyebrow">Platform admin</p>
      <h1 className={styles.h1}>Overview</h1>
      <p className={styles.lede}>Manage hotels, tenants, and platform-wide bookings.</p>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.tenantCount}</div>
          <div className={styles.statLabel}>Tenants</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.listingCount}</div>
          <div className={styles.statLabel}>Published hotels</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.roomCount}</div>
          <div className={styles.statLabel}>Rooms</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.bookingCount}</div>
          <div className={styles.statLabel}>Bookings</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.guestCount}</div>
          <div className={styles.statLabel}>Guests</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 22 }}>{formatIDR(stats.paidRevenue)}</div>
          <div className={styles.statLabel}>Gross paid revenue</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Manage</h2>
      <div className={styles.statGrid}>
        <Link href="/admin/tenants" className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 18 }}>Hotels &amp; tenants →</div>
          <div className={styles.statLabel}>Suspend or activate</div>
        </Link>
        <Link href="/admin/tenants/new" className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 18 }}>Add a hotel →</div>
          <div className={styles.statLabel}>Provision a new tenant</div>
        </Link>
        <Link href="/admin/bookings" className={styles.stat}>
          <div className={styles.statValue} style={{ fontSize: 18 }}>All bookings →</div>
          <div className={styles.statLabel}>Across every hotel</div>
        </Link>
      </div>
    </>
  );
}
