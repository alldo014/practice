import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import styles from "./NavBar.module.css";

const NAV_LINKS = [
  { label: "Hotels", href: "/hotels" },
  { label: "Destinations", href: "/hotels" },
  { label: "Offers", href: "#" },
  { label: "Gallery", href: "#" },
];

export default function NavBar() {
  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="Luxury Stays — home">
          <Image src="/img/logo-luxury.svg" alt="Luxury Stays" width={148} height={41} priority />
        </Link>
        <nav className={styles.nav}>
          <ul className={styles.menu}>
            {NAV_LINKS.map((link, i) => (
              <li key={`${link.label}-${i}`}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button href="/login" variant="outline">
              Sign in
            </Button>
            <Button href="/register" variant="primary">
              Register
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
