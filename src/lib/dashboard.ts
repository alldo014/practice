import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

/** Tenant-owner dashboard context: their tenant, hotel, and quick counts. */
export async function getOwnerDashboard(tenantId: string | null) {
  if (!tenantId) return null;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return null;

  const tenantDb = getTenantDb(tenant.schemaName);
  const [hotel, roomsCount, bookingsCount] = await Promise.all([
    tenantDb.hotel.findFirst(),
    tenantDb.room.count(),
    tenantDb.booking.count(),
  ]);

  return { tenant, hotel, roomsCount, bookingsCount };
}

/** High-level platform counts for the admin overview. */
export async function getAdminCounts() {
  const [tenantCount, listingCount, guestCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.hotelListing.count(),
    prisma.user.count({ where: { role: "guest" } }),
  ]);
  return { tenantCount, listingCount, guestCount };
}
