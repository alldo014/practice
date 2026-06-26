import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";

/** Resolve the tenant + its hotel for an owner. Returns null if not set up. */
export async function getOwnerHotel(tenantId: string | null) {
  if (!tenantId) return null;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return null;
  const tenantDb = getTenantDb(tenant.schemaName);
  const hotel = await tenantDb.hotel.findFirst();
  return { tenant, hotel };
}

export type HotelProfileInput = {
  name: string;
  description: string;
  city: string;
  country: string;
  address: string;
  starRating: number;
  coverImage: string;
  amenities: string[];
};

/**
 * Update an owner's hotel and keep the denormalized public catalog in sync.
 * Updates the tenant-schema Hotel, the public HotelListing (search catalog),
 * and the tenant name. Slug is immutable (stable public URLs / catalog key).
 */
export async function updateOwnerHotel(tenantId: string, input: HotelProfileInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  const tenantDb = getTenantDb(tenant.schemaName);
  const hotel = await tenantDb.hotel.findFirst();
  if (!hotel) throw new Error("Hotel not found");

  await tenantDb.hotel.update({
    where: { id: hotel.id },
    data: {
      name: input.name,
      description: input.description,
      city: input.city,
      country: input.country,
      address: input.address || null,
      starRating: input.starRating,
      coverImage: input.coverImage,
      amenities: input.amenities,
    },
  });

  // Keep the cross-tenant search catalog consistent (slug unchanged).
  await prisma.hotelListing.update({
    where: { tenantId },
    data: {
      name: input.name,
      description: input.description,
      city: input.city,
      country: input.country,
      starRating: input.starRating,
      coverImage: input.coverImage,
      amenities: input.amenities,
    },
  });

  await prisma.tenant.update({ where: { id: tenantId }, data: { name: input.name } });

  return { slug: hotel.slug };
}
