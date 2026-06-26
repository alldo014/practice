import Button from "./Button";
import styles from "./SearchBar.module.css";

/**
 * Hotel search bar — a plain GET form (no client JS) that navigates to
 * /hotels with the query string. Dates/guests are carried through for the
 * booking step; listing filtering uses `q`.
 */
export default function SearchBar({
  defaultQuery = "",
}: {
  defaultQuery?: string;
}) {
  return (
    <form className={styles.bar} action="/hotels" method="get">
      <div className={styles.field}>
        <label htmlFor="q">Destination</label>
        <input id="q" name="q" type="text" placeholder="City or hotel name" defaultValue={defaultQuery} />
      </div>
      <div className={styles.field}>
        <label htmlFor="checkIn">Check-in</label>
        <input id="checkIn" name="checkIn" type="date" />
      </div>
      <div className={styles.field}>
        <label htmlFor="checkOut">Check-out</label>
        <input id="checkOut" name="checkOut" type="date" />
      </div>
      <div className={styles.field}>
        <label htmlFor="guests">Guests</label>
        <input id="guests" name="guests" type="number" min={1} max={20} defaultValue={2} />
      </div>
      <div className={styles.submit}>
        <Button type="submit" size="lg">
          Search
        </Button>
      </div>
    </form>
  );
}
