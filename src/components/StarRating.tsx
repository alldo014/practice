import styles from "./StarRating.module.css";

/** Gold filled/empty stars out of 5. */
export default function StarRating({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={styles.stars} aria-label={`${filled} out of 5 stars`} role="img">
      {"★".repeat(filled)}
      <span className={styles.empty}>{"★".repeat(5 - filled)}</span>
    </span>
  );
}
