import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type BookingStatusFilter = "pending" | "confirmed" | "cancelled";

export class OwnerBookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnerBookingError";
  }
}

async function resolveTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new OwnerBookingError("Tenant not found.");
  return tenant;
}

/** Bookings for the owner's hotel, newest first, optionally filtered by status. */
export async function listOwnerBookings(tenantId: string, status?: BookingStatusFilter) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);
  const bookings = await tenantDb.booking.findMany({
    where: status ? { status } : undefined,
    include: { room: { select: { type: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { tenant, bookings };
}

/**
 * Cancel a booking in the owner's schema. Sets status=cancelled, which frees
 * the dates (the availability overlap check ignores cancelled bookings).
 */
export async function cancelOwnerBooking(tenantId: string, bookingId: string) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);

  const booking = await tenantDb.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new OwnerBookingError("Booking not found.");
  if (booking.status === "cancelled") return; // idempotent

  await tenantDb.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  });
}
