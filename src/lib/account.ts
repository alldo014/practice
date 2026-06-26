import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type UserBooking = {
  id: string;
  hotelName: string;
  hotelSlug: string;
  city: string;
  country: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  createdAt: Date;
};

/**
 * All bookings for a guest across every hotel. Bookings live in per-tenant
 * schemas with no global index, so we scan each published hotel's schema for
 * rows matching the user (fine for the MVP's handful of tenants; a global
 * booking index would be the scale path).
 */
export async function getUserBookings(userId: string): Promise<UserBooking[]> {
  const listings = await prisma.hotelListing.findMany({
    where: { status: "published" },
    select: { schemaName: true, name: true, slug: true, city: true, country: true },
  });

  const perHotel = await Promise.all(
    listings.map(async (listing) => {
      const tenantDb = getTenantDb(listing.schemaName);
      const bookings = await tenantDb.booking.findMany({
        where: { guestId: userId },
        include: { room: { select: { type: true } } },
      });
      return bookings.map((b) => ({
        id: b.id,
        hotelName: listing.name,
        hotelSlug: listing.slug,
        city: listing.city,
        country: listing.country,
        roomType: b.room.type,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guests: b.guests,
        totalAmount: b.totalAmount.toString(),
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      }));
    }),
  );

  return perHotel.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
