import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { getTenantDb, disconnectAllTenantDbs } from "../src/lib/tenant-db";
import { provisionTenantSchema } from "./provision";

type RoomSeed = {
  type: string;
  description: string;
  capacity: number;
  beds: number;
  basePrice: number; // IDR
  photos: string[];
};

type HotelSeed = {
  name: string;
  slug: string;
  city: string;
  country: string;
  description: string;
  starRating: number;
  address: string;
  coverImage: string;
  amenities: string[];
  rooms: RoomSeed[];
};

const HOTELS: HotelSeed[] = [
  {
    name: "The Grand Azure",
    slug: "the-grand-azure",
    city: "Seminyak, Bali",
    country: "Indonesia",
    description:
      "A cliff-edge sanctuary where infinity pools meet the Indian Ocean. Understated luxury, sea-salt air, and sunsets that linger.",
    starRating: 5,
    address: "Jl. Kayu Aya No. 9, Seminyak, Bali",
    coverImage: "/img/explore-1.jpg",
    amenities: ["Infinity Pool", "Private Beach", "Spa & Wellness", "Airport Transfer", "Breakfast Included", "Free WiFi"],
    rooms: [
      { type: "Deluxe Garden Room", description: "Serene room opening onto tropical gardens.", capacity: 2, beds: 1, basePrice: 1850000, photos: ["/img/explore-1.jpg", "/img/service.jpg"] },
      { type: "Ocean Suite", description: "Floor-to-ceiling ocean views with a private terrace.", capacity: 3, beds: 2, basePrice: 3600000, photos: ["/img/explore-2.jpg", "/img/hero.jpg"] },
      { type: "Cliffside Villa", description: "Private villa with a plunge pool above the surf.", capacity: 4, beds: 2, basePrice: 8200000, photos: ["/img/hero-2.png", "/img/explore-3.jpg"] },
    ],
  },
  {
    name: "Méridien Heights",
    slug: "meridien-heights",
    city: "Jakarta",
    country: "Indonesia",
    description:
      "A polished urban retreat in the heart of the capital — skyline suites, a rooftop bar, and service tuned to the rhythm of the city.",
    starRating: 5,
    address: "Jl. M.H. Thamrin No. 1, Jakarta Pusat",
    coverImage: "/img/explore-2.jpg",
    amenities: ["Rooftop Bar", "Fitness Center", "Business Lounge", "Airport Transfer", "Breakfast Included", "Free WiFi"],
    rooms: [
      { type: "Premier Room", description: "Calm, contemporary room high above the city.", capacity: 2, beds: 1, basePrice: 1450000, photos: ["/img/explore-2.jpg", "/img/service.jpg"] },
      { type: "Executive Suite", description: "Separate living area with lounge access.", capacity: 3, beds: 1, basePrice: 2900000, photos: ["/img/explore-1.jpg", "/img/hero.jpg"] },
      { type: "Sky Penthouse", description: "Top-floor penthouse with panoramic skyline views.", capacity: 4, beds: 2, basePrice: 6800000, photos: ["/img/hero-2.png", "/img/explore-3.jpg"] },
    ],
  },
  {
    name: "Santé Lagoon Resort",
    slug: "sante-lagoon-resort",
    city: "Lombok",
    country: "Indonesia",
    description:
      "Overwater villas on a glass-clear lagoon. Barefoot luxury, reef snorkeling at your doorstep, and a spa carved into the hillside.",
    starRating: 5,
    address: "Tanjung Aan, Kuta Mandalika, Lombok",
    coverImage: "/img/explore-3.jpg",
    amenities: ["Overwater Villas", "House Reef", "Spa & Wellness", "Water Sports", "Breakfast Included", "Free WiFi"],
    rooms: [
      { type: "Lagoon Bungalow", description: "Beachfront bungalow steps from the lagoon.", capacity: 2, beds: 1, basePrice: 2100000, photos: ["/img/explore-3.jpg", "/img/service.jpg"] },
      { type: "Overwater Villa", description: "Suspended over the reef with a glass floor.", capacity: 3, beds: 1, basePrice: 4500000, photos: ["/img/explore-1.jpg", "/img/hero.jpg"] },
      { type: "Royal Reserve", description: "Two-bedroom reserve with a private infinity pool.", capacity: 4, beds: 2, basePrice: 9500000, photos: ["/img/hero-2.png", "/img/explore-2.jpg"] },
    ],
  },
];

/** Deterministic, idempotent schema name derived from the tenant slug. */
function schemaFor(slug: string): string {
  return `tenant_${slug.replace(/-/g, "_")}`;
}

async function main() {
  console.log("→ Seeding platform...");

  // Demo guest account (password: password123) for testing later auth/booking.
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "guest@example.com" },
    update: {},
    create: {
      email: "guest@example.com",
      name: "Demo Guest",
      passwordHash,
      role: "guest",
    },
  });
  console.log("  ✓ demo guest: guest@example.com / password123");

  for (const h of HOTELS) {
    const schemaName = schemaFor(h.slug);

    const tenant = await prisma.tenant.upsert({
      where: { slug: h.slug },
      update: { name: h.name, schemaName, status: "active" },
      create: { name: h.name, slug: h.slug, schemaName, status: "active" },
    });

    // (Re)create the tenant's private schema + tables — idempotent.
    await provisionTenantSchema(schemaName, { reset: true });

    const tdb = getTenantDb(schemaName);
    const hotel = await tdb.hotel.create({
      data: {
        name: h.name,
        slug: h.slug,
        city: h.city,
        country: h.country,
        description: h.description,
        starRating: h.starRating,
        address: h.address,
        coverImage: h.coverImage,
        amenities: h.amenities,
        rooms: {
          create: h.rooms.map((r) => ({
            type: r.type,
            description: r.description,
            capacity: r.capacity,
            beds: r.beds,
            basePrice: r.basePrice.toString(),
            photos: r.photos,
          })),
        },
      },
      include: { rooms: true },
    });

    const minPrice = Math.min(...h.rooms.map((r) => r.basePrice));

    // Denormalized catalog row in the shared schema for cross-hotel search.
    await prisma.hotelListing.upsert({
      where: { tenantId: tenant.id },
      update: {
        schemaName,
        hotelId: hotel.id,
        name: h.name,
        slug: h.slug,
        city: h.city,
        country: h.country,
        description: h.description,
        starRating: h.starRating,
        minPrice: minPrice.toString(),
        coverImage: h.coverImage,
        amenities: h.amenities,
        status: "published",
      },
      create: {
        tenantId: tenant.id,
        schemaName,
        hotelId: hotel.id,
        name: h.name,
        slug: h.slug,
        city: h.city,
        country: h.country,
        description: h.description,
        starRating: h.starRating,
        minPrice: minPrice.toString(),
        coverImage: h.coverImage,
        amenities: h.amenities,
        status: "published",
      },
    });

    console.log(`  ✓ ${h.name} (${schemaName}) — ${hotel.rooms.length} rooms, from IDR ${minPrice.toLocaleString("en-US")}`);
  }

  console.log("✓ Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await disconnectAllTenantDbs();
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await prisma.$disconnect();
    await disconnectAllTenantDbs();
    process.exit(1);
  });
