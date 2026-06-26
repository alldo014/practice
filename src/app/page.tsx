import SearchBar from "@/components/SearchBar";
import HotelCard from "@/components/HotelCard";
import { searchListings } from "@/lib/catalog";
import styles from "./page.module.css";

// Featured hotels come from the live catalog — render per request, not at build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await searchListings();

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className="eyebrow">Experience Luxury Stays</p>
            <h1 className={styles.title}>Your Gateway to Unforgettable Hotel Experiences</h1>
            <p className={styles.subtitle}>
              Discover curated luxury hotels across Indonesia — exceptional comfort,
              unparalleled service, and effortless booking.
            </p>
          </div>
          <div className={styles.search}>
            <SearchBar />
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHead}>
          <p className="eyebrow">Featured Stays</p>
          <h2 className={styles.sectionTitle}>Handpicked hotels for your next escape</h2>
        </div>
        <div className={styles.grid}>
          {listings.map((l) => (
            <HotelCard
              key={l.id}
              hotel={{
                slug: l.slug,
                name: l.name,
                city: l.city,
                country: l.country,
                coverImage: l.coverImage,
                starRating: l.starRating,
                minPrice: l.minPrice.toString(),
                amenities: l.amenities,
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
