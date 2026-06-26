import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StarRating from "@/components/StarRating";
import { getListingBySlug, getHotelWithRooms } from "@/lib/catalog";
import { formatIDR } from "@/lib/format";
import styles from "./page.module.css";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Hotel not found — Luxury Stays" };
  return {
    title: `${listing.name} — Luxury Stays`,
    description: listing.description,
  };
}

export default async function HotelDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  // Operational data (hotel + rooms) lives in the tenant's private schema.
  const hotel = await getHotelWithRooms(listing.schemaName, listing.hotelId);
  if (!hotel) notFound();

  return (
    <>
      <section className={styles.cover}>
        <Image src={hotel.coverImage} alt={hotel.name} fill sizes="100vw" priority />
        <div className={styles.coverInner}>
          <div className="container">
            <StarRating rating={hotel.starRating} />
            <h1 className={styles.name}>{hotel.name}</h1>
            <p className={styles.location}>
              {hotel.city}, {hotel.country}
              {hotel.address ? ` · ${hotel.address}` : ""}
            </p>
          </div>
        </div>
      </section>

      <div className={`container ${styles.body}`}>
        <Link href="/hotels" className={styles.back}>
          ← Back to all hotels
        </Link>

        <p className={styles.description}>{hotel.description}</p>

        {hotel.amenities.length > 0 && (
          <div className={styles.amenities}>
            {hotel.amenities.map((a) => (
              <span key={a} className={styles.chip}>
                {a}
              </span>
            ))}
          </div>
        )}

        <h2 className={styles.roomsTitle}>Choose your room</h2>
        <div className={styles.rooms}>
          {hotel.rooms.map((room) => (
            <Card key={room.id} className={styles.room}>
              <div className={styles.roomMedia}>
                <Image
                  src={room.photos[0] ?? hotel.coverImage}
                  alt={room.type}
                  fill
                  sizes="(max-width: 720px) 100vw, 240px"
                />
              </div>
              <div>
                <h3 className={styles.roomType}>{room.type}</h3>
                {room.description && <p className={styles.roomDesc}>{room.description}</p>}
                <p className={styles.roomMeta}>
                  Sleeps {room.capacity} · {room.beds} {room.beds === 1 ? "bed" : "beds"}
                </p>
              </div>
              <div className={styles.roomBuy}>
                <span className={styles.roomPrice}>
                  {formatIDR(room.basePrice)} <span className={styles.roomPriceUnit}>/ night</span>
                </span>
                <Button href={`/hotels/${slug}/book?roomId=${room.id}`} variant="primary">
                  Book this room
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
