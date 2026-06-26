import type { Metadata } from "next";
import HotelCard from "@/components/HotelCard";
import Button from "@/components/Button";
import { searchListings, listCities } from "@/lib/catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Hotels — Luxury Stays",
  description: "Browse curated luxury hotels across Indonesia.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function firstParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() !== "" ? v : undefined;
}

export default async function HotelsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const city = firstParam(sp.city);

  const [listings, cities] = await Promise.all([searchListings({ q, city }), listCities()]);

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.head}>
        <p className="eyebrow">Find your stay</p>
        <h1 className={styles.title}>Luxury Hotels</h1>
      </div>

      <form className={styles.filters} action="/hotels" method="get">
        <div className={styles.field}>
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="text" placeholder="City or hotel name" defaultValue={q ?? ""} />
        </div>
        <div className={styles.field}>
          <label htmlFor="city">City</label>
          <select id="city" name="city" defaultValue={city ?? ""}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply filters</Button>
      </form>

      <p className={styles.count}>
        {listings.length} {listings.length === 1 ? "hotel" : "hotels"}
        {q ? ` matching “${q}”` : ""}
        {city ? ` in ${city}` : ""}
      </p>

      {listings.length === 0 ? (
        <div className={styles.empty}>
          <h3>No hotels found</h3>
          <p>Try a different city or clear your search.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
