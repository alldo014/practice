import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { getTenantDb } from "./tenant-db";
import { provisionTenantSchema } from "./provision";

export class ProvisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvisionError";
  }
}

export type ProvisionInput = {
  name: string;
  slug: string;
  city: string;
  country: string;
  description: string;
  starRating: number;
  coverImage: string;
  amenities: string[];
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  roomType: string;
  roomCapacity: number;
  roomBeds: number;
  roomBasePrice: number;
};

const SCHEMA_NAME_RE = /^tenant_[a-z0-9_]+$/;

/**
 * Provision a brand-new hotel/tenant at runtime: a public Tenant, its private
 * `tenant_<...>` schema + tables, an initial Hotel + Room, the public catalog
 * listing, and a tenant_owner account — all from the admin "Add a hotel" form.
 * Uniqueness is checked up front; on any failure mid-way we best-effort clean up.
 */
export async function provisionNewTenant(input: ProvisionInput) {
  const schemaName = `tenant_${input.slug.replace(/-/g, "_")}`;
  if (!SCHEMA_NAME_RE.test(schemaName)) {
    throw new ProvisionError("Slug must be lowercase letters, numbers, and hyphens.");
  }

  // Up-front uniqueness checks (reduce partial-failure risk).
  if (await prisma.tenant.findUnique({ where: { slug: input.slug } })) {
    throw new ProvisionError("A hotel with that slug already exists.");
  }
  if (await prisma.tenant.findUnique({ where: { schemaName } })) {
    throw new ProvisionError("That schema name is already taken.");
  }
  if (await prisma.hotelListing.findUnique({ where: { slug: input.slug } })) {
    throw new ProvisionError("A listing with that slug already exists.");
  }
  if (await prisma.user.findUnique({ where: { email: input.ownerEmail } })) {
    throw new ProvisionError("An account with that owner email already exists.");
  }

  const tenant = await prisma.tenant.create({
    data: { name: input.name, slug: input.slug, schemaName, status: "active" },
  });

  try {
    await provisionTenantSchema(schemaName);

    const tenantDb = getTenantDb(schemaName);
    const hotel = await tenantDb.hotel.create({
      data: {
        name: input.name,
        slug: input.slug,
        city: input.city,
        country: input.country,
        description: input.description,
        starRating: input.starRating,
        coverImage: input.coverImage,
        amenities: input.amenities,
        rooms: {
          create: {
            type: input.roomType,
            capacity: input.roomCapacity,
            beds: input.roomBeds,
            basePrice: input.roomBasePrice.toString(),
            photos: [input.coverImage],
          },
        },
      },
    });

    await prisma.hotelListing.create({
      data: {
        tenantId: tenant.id,
        schemaName,
        hotelId: hotel.id,
        name: input.name,
        slug: input.slug,
        city: input.city,
        country: input.country,
        description: input.description,
        starRating: input.starRating,
        minPrice: input.roomBasePrice.toString(),
        coverImage: input.coverImage,
        amenities: input.amenities,
        status: "published",
      },
    });

    const passwordHash = await bcrypt.hash(input.ownerPassword, 10);
    await prisma.user.create({
      data: {
        name: input.ownerName,
        email: input.ownerEmail,
        passwordHash,
        role: "tenant_owner",
        tenantId: tenant.id,
      },
    });

    return { slug: input.slug, schemaName };
  } catch (error) {
    // Best-effort rollback of a partial provision.
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await prisma.hotelListing.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.user.deleteMany({ where: { email: input.ownerEmail } });
      await prisma.tenant.delete({ where: { id: tenant.id } });
    } catch (cleanupError) {
      console.error("Provision cleanup failed:", cleanupError);
    }
    console.error("Provision failed:", error);
    throw new ProvisionError("Could not create the hotel. Please try again.");
  }
}
