import Image from "next/image";
import Link from "next/link";
import Card from "./Card";
import StarRating from "./StarRating";
import { formatIDR } from "@/lib/format";
import styles from "./HotelCard.module.css";

export type HotelCardData = {
  slug: string;
  name: string;
  city: string;
  country: string;
  coverImage: string;
  starRating: number;
  minPrice: string | number;
  amenities?: string[];
};

export default function HotelCard({ hotel }: { hotel: HotelCardData }) {
  return (
    <Link href={`/hotels/${hotel.slug}`} aria-label={`View ${hotel.name}`}>
      <Card className={styles.card}>
        <div className={styles.media}>
          <Image
            src={hotel.coverImage}
            alt={hotel.name}
            fill
            sizes="(max-width: 720px) 100vw, 350px"
          />
        </div>
        <div className={styles.body}>
          <div className={styles.topRow}>
            <span className={styles.name}>{hotel.name}</span>
            <StarRating rating={hotel.starRating} />
          </div>
          <span className={styles.location}>
            {hotel.city}, {hotel.country}
          </span>
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className={styles.amenities}>
              {hotel.amenities.slice(0, 3).map((a) => (
                <span key={a} className={styles.chip}>
                  {a}
                </span>
              ))}
            </div>
          )}
          <div className={styles.footer}>
            <span className={styles.price}>
              {formatIDR(hotel.minPrice)} <span className={styles.priceUnit}>/ night</span>
            </span>
            <span className={styles.cta}>View details →</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
