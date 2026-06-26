import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type BookingErrorCode = "NOT_FOUND" | "INVALID" | "CONFLICT";

export class BookingError extends Error {
  code: BookingErrorCode;
  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "BookingError";
  }
}

export type CreateBookingInput = {
  user: { id: string; email: string };
  slug: string;
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse a YYYY-MM-DD date as UTC midnight. */
function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Create a `pending` booking in the hotel's tenant schema after an availability
 * overlap check. The check + insert run in a SERIALIZABLE transaction so two
 * concurrent requests cannot double-book the same room/date range.
 */
export async function createBooking(input: CreateBookingInput) {
  const { user, slug, roomId, checkIn, checkOut, guests } = input;

  const listing = await prisma.hotelListing.findUnique({ where: { slug } });
  if (!listing) throw new BookingError("NOT_FOUND", "Hotel not found.");

  const tenantDb = getTenantDb(listing.schemaName);

  const room = await tenantDb.room.findUnique({ where: { id: roomId } });
  if (!room || room.hotelId !== listing.hotelId) {
    throw new BookingError("NOT_FOUND", "Room not found for this hotel.");
  }

  const ci = parseDate(checkIn);
  const co = parseDate(checkOut);
  if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) {
    throw new BookingError("INVALID", "Invalid dates.");
  }
  if (ci < startOfTodayUTC()) {
    throw new BookingError("INVALID", "Check-in date cannot be in the past.");
  }
  if (co <= ci) {
    throw new BookingError("INVALID", "Check-out must be after check-in.");
  }
  if (guests < 1 || guests > room.capacity) {
    throw new BookingError("INVALID", `This room sleeps up to ${room.capacity} guest(s).`);
  }

  const nights = Math.round((co.getTime() - ci.getTime()) / MS_PER_DAY);
  const total = room.basePrice.mul(nights);

  const booking = await tenantDb.$transaction(
    async (tx) => {
      // Overlap on half-open interval [checkIn, checkOut): existing.checkIn < newCheckOut
      // AND existing.checkOut > newCheckIn, ignoring cancelled bookings.
      const conflict = await tx.booking.findFirst({
        where: {
          roomId,
          status: { not: "cancelled" },
          checkIn: { lt: co },
          checkOut: { gt: ci },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new BookingError("CONFLICT", "Those dates are no longer available for this room.");
      }

      return tx.booking.create({
        data: {
          roomId,
          guestId: user.id,
          guestEmail: user.email,
          checkIn: ci,
          checkOut: co,
          guests,
          totalAmount: total,
          currency: room.currency,
          status: "pending",
          paymentStatus: "unpaid",
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

  return {
    bookingId: booking.id,
    nights,
    total: total.toString(),
    currency: room.currency,
  };
}
