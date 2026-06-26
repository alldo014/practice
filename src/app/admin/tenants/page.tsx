import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { requireRole } from "@/lib/auth-helpers";
import { listTenants } from "@/lib/admin";
import TenantStatusButton from "./TenantStatusButton";
import consoleStyles from "@/components/console.module.css";
import styles from "./tenants.module.css";

export const metadata: Metadata = { title: "Hotels & tenants — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
  await requireRole("admin");
  const tenants = await listTenants();

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <p className="eyebrow">Platform admin</p>
          <h1 className={consoleStyles.h1}>Hotels &amp; tenants</h1>
        </div>
        <Button href="/admin/tenants/new">Add a hotel</Button>
      </div>

      {tenants.length === 0 ? (
        <div className={consoleStyles.empty}>No tenants yet.</div>
      ) : (
        <div className={styles.list}>
          {tenants.map(({ tenant, listing, roomsCount, bookingsCount }) => {
            const suspended = tenant.status === "suspended";
            return (
              <Card key={tenant.id} className={styles.tenant}>
                <div>
                  <div className={styles.name}>
                    {listing && !suspended ? (
                      <Link href={`/hotels/${listing.slug}`}>{tenant.name}</Link>
                    ) : (
                      tenant.name
                    )}
                  </div>
                  <div className={styles.meta}>
                    <span className={styles.schema}>{tenant.schemaName}</span> · {roomsCount} rooms ·{" "}
                    {bookingsCount} bookings
                    {listing ? ` · ${listing.city}, ${listing.country}` : ""}
                  </div>
                </div>
                <span className={`${styles.badge} ${suspended ? styles.suspended : styles.active}`}>
                  {suspended ? "Suspended" : "Active"}
                </span>
                <TenantStatusButton tenantId={tenant.id} status={tenant.status as "active" | "suspended"} />
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
