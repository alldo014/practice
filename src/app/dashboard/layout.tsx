import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import styles from "@/components/console.module.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole("tenant_owner");

  return (
    <div className={`container ${styles.shell}`}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>Hotel dashboard</p>
        <nav className={styles.nav}>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/hotel">Hotel profile</Link>
          <Link href="/dashboard/rooms">Rooms &amp; rates</Link>
          <Link href="/dashboard/bookings">Bookings</Link>
        </nav>
      </aside>
      <section className={styles.content}>{children}</section>
    </div>
  );
}
