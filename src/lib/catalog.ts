import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

export type ListingFilters = {
  q?: string;
  city?: string;
};

/** Search the shared cross-tenant catalog (public.hotel_listings). */
export async function searchListings(filters: ListingFilters = {}) {
  const { q, city } = filters;
  return prisma.hotelListing.findMany({
    where: {
      status: "published",
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { minPrice: "asc" },
  });
}

/** Distinct published cities, for the listings filter. */
export async function listCities(): Promise<string[]> {
  const rows = await prisma.hotelListing.findMany({
    where: { status: "published" },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city);
}

export async function getListingBySlug(slug: string) {
  return prisma.hotelListing.findUnique({ where: { slug } });
}

/** Fetch the hotel + its rooms from the tenant's private schema. */
export async function getHotelWithRooms(schemaName: string, hotelId: string) {
  const tenantDb = getTenantDb(schemaName);
  return tenantDb.hotel.findUnique({
    where: { id: hotelId },
    include: { rooms: { orderBy: { basePrice: "asc" } } },
  });
}
