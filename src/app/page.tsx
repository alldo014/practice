import Button from "@/components/Button";
import styles from "./page.module.css";

export default function Home() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <p className="eyebrow">Experience Luxury Stays</p>
        <h1 className={styles.title}>Your Gateway to Unforgettable Hotel Experiences</h1>
        <p className={styles.subtitle}>
          Discover curated luxury hotels across Indonesia — exceptional comfort,
          unparalleled service, and effortless booking.
        </p>
        <div className={styles.actions}>
          <Button href="/hotels" variant="outline" size="lg">
            Explore Our Hotels
          </Button>
        </div>
      </div>
    </section>
  );
}
