import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type TenantStatus = "active" | "suspended";

/** Platform-wide stats for the admin overview (scans every tenant schema). */
export async function getPlatformStats() {
  const tenants = await prisma.tenant.findMany({ select: { schemaName: true } });
  const [listingCount, guestCount] = await Promise.all([
    prisma.hotelListing.count(),
    prisma.user.count({ where: { role: "guest" } }),
  ]);

  const perTenant = await Promise.all(
    tenants.map(async ({ schemaName }) => {
      const tenantDb = getTenantDb(schemaName);
      const [rooms, bookings, paid] = await Promise.all([
        tenantDb.room.count(),
        tenantDb.booking.count(),
        tenantDb.booking.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: "paid" },
        }),
      ]);
      return { rooms, bookings, paidRevenue: Number(paid._sum.totalAmount ?? 0) };
    }),
  );

  return {
    tenantCount: tenants.length,
    listingCount,
    guestCount,
    roomCount: perTenant.reduce((sum, t) => sum + t.rooms, 0),
    bookingCount: perTenant.reduce((sum, t) => sum + t.bookings, 0),
    paidRevenue: perTenant.reduce((sum, t) => sum + t.paidRevenue, 0),
  };
}

export type AdminBooking = {
  id: string;
  hotelName: string;
  hotelSlug: string;
  guestEmail: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  createdAt: Date;
};

/** Every booking across every tenant, newest first (admin view). */
export async function listAllBookings(): Promise<AdminBooking[]> {
  const tenants = await prisma.tenant.findMany({
    select: { schemaName: true, name: true, slug: true },
  });

  const perTenant = await Promise.all(
    tenants.map(async (tenant) => {
      const tenantDb = getTenantDb(tenant.schemaName);
      const bookings = await tenantDb.booking.findMany({
        include: { room: { select: { type: true } } },
      });
      return bookings.map((b) => ({
        id: b.id,
        hotelName: tenant.name,
        hotelSlug: tenant.slug,
        guestEmail: b.guestEmail,
        roomType: b.room.type,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalAmount: b.totalAmount.toString(),
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      }));
    }),
  );

  return perTenant.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

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
