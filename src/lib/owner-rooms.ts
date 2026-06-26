import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type RoomErrorCode = "NOT_FOUND" | "IN_USE";

export class RoomError extends Error {
  code: RoomErrorCode;
  constructor(code: RoomErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "RoomError";
  }
}

export type RoomInput = {
  type: string;
  description: string;
  capacity: number;
  beds: number;
  basePrice: number; // IDR integer
  photos: string[];
};

async function resolveTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new RoomError("NOT_FOUND", "Tenant not found.");
  return tenant;
}

/** Recompute the catalog "from" price from the cheapest room. */
async function syncMinPrice(tenantId: string, schemaName: string) {
  const tenantDb = getTenantDb(schemaName);
  const agg = await tenantDb.room.aggregate({ _min: { basePrice: true } });
  await prisma.hotelListing.update({
    where: { tenantId },
    data: { minPrice: agg._min.basePrice ?? 0 },
  });
}

export async function listOwnerRooms(tenantId: string) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);
  const [hotel, rooms] = await Promise.all([
    tenantDb.hotel.findFirst(),
    tenantDb.room.findMany({ orderBy: { basePrice: "asc" } }),
  ]);
  return { tenant, hotel, rooms };
}

export async function getOwnerRoom(tenantId: string, roomId: string) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);
  return tenantDb.room.findUnique({ where: { id: roomId } });
}

export async function createRoom(tenantId: string, input: RoomInput) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);
  const hotel = await tenantDb.hotel.findFirst();
  if (!hotel) throw new RoomError("NOT_FOUND", "Hotel not found.");

  await tenantDb.room.create({
    data: {
      hotelId: hotel.id,
      type: input.type,
      description: input.description || null,
      capacity: input.capacity,
      beds: input.beds,
      basePrice: input.basePrice.toString(),
      photos: input.photos,
    },
  });
  await syncMinPrice(tenantId, tenant.schemaName);
  return { slug: hotel.slug };
}

export async function updateRoom(tenantId: string, roomId: string, input: RoomInput) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);
  const room = await tenantDb.room.findUnique({ where: { id: roomId } });
  if (!room) throw new RoomError("NOT_FOUND", "Room not found.");

  await tenantDb.room.update({
    where: { id: roomId },
    data: {
      type: input.type,
      description: input.description || null,
      capacity: input.capacity,
      beds: input.beds,
      basePrice: input.basePrice.toString(),
      photos: input.photos,
    },
  });
  await syncMinPrice(tenantId, tenant.schemaName);
}

export async function deleteRoom(tenantId: string, roomId: string) {
  const tenant = await resolveTenant(tenantId);
  const tenantDb = getTenantDb(tenant.schemaName);
  const room = await tenantDb.room.findUnique({ where: { id: roomId } });
  if (!room) throw new RoomError("NOT_FOUND", "Room not found.");

  // Bookings reference rooms with onDelete: Restrict — block (and message) if any exist.
  const bookingCount = await tenantDb.booking.count({ where: { roomId } });
  if (bookingCount > 0) {
    throw new RoomError(
      "IN_USE",
      "This room has bookings and can't be deleted. Cancel or wait for them to clear first.",
    );
  }

  await tenantDb.room.delete({ where: { id: roomId } });
  await syncMinPrice(tenantId, tenant.schemaName);
}
