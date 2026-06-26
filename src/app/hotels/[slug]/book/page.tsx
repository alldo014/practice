import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import { requireUser } from "@/lib/auth-helpers";
import { getListingBySlug, getHotelWithRooms } from "@/lib/catalog";
import { formatIDR } from "@/lib/format";
import BookingForm from "./BookingForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Book your stay — Luxury Stays" };

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function firstParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() !== "" ? v : undefined;
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  // Auth-gated: redirects to /login when not signed in.
  await requireUser();

  const { slug } = await params;
  const sp = await searchParams;
  const roomId = firstParam(sp.roomId);

  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const hotel = await getHotelWithRooms(listing.schemaName, listing.hotelId);
  if (!hotel) notFound();

  const room = roomId ? hotel.rooms.find((r) => r.id === roomId) : undefined;
  if (!room) notFound();

  return (
    <div className={`container ${styles.page}`}>
      <Link href={`/hotels/${slug}`} className={styles.back}>
        ← Back to {hotel.name}
      </Link>
      <p className="eyebrow">{hotel.name}</p>
      <h1 className={styles.title}>Book your stay</h1>
      <p className={styles.subtitle}>
        {hotel.city}, {hotel.country}
      </p>

      <Card className={styles.summary}>
        <div className={styles.summaryMedia}>
          <Image
            src={room.photos[0] ?? hotel.coverImage}
            alt={room.type}
            fill
            sizes="120px"
          />
        </div>
        <div>
          <div className={styles.roomType}>{room.type}</div>
          <div className={styles.roomMeta}>
            Sleeps {room.capacity} · {room.beds} {room.beds === 1 ? "bed" : "beds"}
          </div>
          <div className={styles.price}>
            {formatIDR(room.basePrice)} <span className={styles.priceUnit}>/ night</span>
          </div>
        </div>
      </Card>

      <BookingForm
        slug={slug}
        roomId={room.id}
        capacity={room.capacity}
        basePrice={Number(room.basePrice)}
        defaultCheckIn={firstParam(sp.checkIn)}
        defaultCheckOut={firstParam(sp.checkOut)}
        defaultGuests={firstParam(sp.guests)}
      />
    </div>
  );
}
