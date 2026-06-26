import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import styles from "@/components/console.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  return (
    <div className={`container ${styles.shell}`}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>Platform admin</p>
        <nav className={styles.nav}>
          <Link href="/admin">Overview</Link>
          <Link href="/admin/tenants">Hotels &amp; tenants</Link>
          <Link href="/admin/tenants/new">Add a hotel</Link>
          <Link href="/admin/bookings">All bookings</Link>
        </nav>
      </aside>
      <section className={styles.content}>{children}</section>
    </div>
  );
}
