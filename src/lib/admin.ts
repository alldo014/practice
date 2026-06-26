import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type TenantStatus = "active" | "suspended";

/** All tenants with their catalog listing and per-schema counts (admin view). */
export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: { listing: true },
  });

  return Promise.all(
    tenants.map(async (tenant) => {
      const tenantDb = getTenantDb(tenant.schemaName);
      const [roomsCount, bookingsCount] = await Promise.all([
        tenantDb.room.count(),
        tenantDb.booking.count(),
      ]);
      return { tenant, listing: tenant.listing, roomsCount, bookingsCount };
    }),
  );
}

/**
 * Suspend or activate a tenant. Suspending archives its public listing so it
 * disappears from search/detail; activating republishes it. Tenant + listing
 * are updated atomically.
 */
export async function setTenantStatus(tenantId: string, status: TenantStatus) {
  const listingStatus = status === "suspended" ? "archived" : "published";
  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { status } }),
    prisma.hotelListing.updateMany({ where: { tenantId }, data: { status: listingStatus } }),
  ]);
}
