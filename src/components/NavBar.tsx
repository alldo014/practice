import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";
import { roleHome } from "@/lib/roles";
import styles from "./NavBar.module.css";

const NAV_LINKS = [
  { label: "Hotels", href: "/hotels" },
  { label: "Destinations", href: "/hotels" },
  { label: "Offers", href: "#" },
  { label: "Gallery", href: "#" },
];

export default async function NavBar() {
  const session = await auth();
  const user = session?.user;

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
            {user ? (
              <>
                {user.role !== "guest" && (
                  <Link href={roleHome(user.role)} className={styles.greeting}>
                    {user.role === "admin" ? "Admin" : "Dashboard"}
                  </Link>
                )}
                <Link href="/account" className={styles.greeting}>
                  {user.name ?? user.email}
                </Link>
                <form action={logout}>
                  <Button type="submit" variant="outline">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button href="/login" variant="outline">
                  Sign in
                </Button>
                <Button href="/register" variant="primary">
                  Register
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
