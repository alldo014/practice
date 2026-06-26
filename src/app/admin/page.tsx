import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { getAdminCounts } from "@/lib/dashboard";
import styles from "@/components/console.module.css";

export const metadata: Metadata = { title: "Admin — Luxury Stays" };
export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await requireRole("admin");
  const counts = await getAdminCounts();

  return (
    <>
      <p className="eyebrow">Platform admin</p>
      <h1 className={styles.h1}>Overview</h1>
      <p className={styles.lede}>Manage hotels, tenants, and platform-wide bookings.</p>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{counts.tenantCount}</div>
          <div className={styles.statLabel}>Tenants</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{counts.listingCount}</div>
          <div className={styles.statLabel}>Published hotels</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{counts.guestCount}</div>
          <div className={styles.statLabel}>Guests</div>
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
