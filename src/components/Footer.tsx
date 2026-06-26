import Image from "next/image";
import styles from "./Footer.module.css";

const EXPLORE = ["Rooms", "Suites", "Dining", "Events", "Spa", "Local"];
const POLICIES = ["Site Notice", "Data Security", "Service Terms", "GDPR", "Content Policy", "Accessibility"];
const SOCIAL = ["/img/social-1.jpg", "/img/social-2.jpg", "/img/social-3.jpg", "/img/social-4.jpg"];

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h6 className={styles.colTitle}>{title}</h6>
      <ul className={styles.colList}>
        {items.map((item) => (
          <li key={item}>
            <a href="#">{item}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div>
          <Image
            src="/img/logo-luxury.svg"
            alt="Luxury Stays"
            width={148}
            height={41}
            className={styles.logo}
          />
          <p className={styles.copy}>© 2026 Luxury Stays. All rights reserved.</p>
          <div className={styles.language}>
            <Image src="/img/eng-flag.jpg" alt="" width={16} height={16} />
            <span>English (US)</span>
            <Image src="/img/cheveron-down.jpg" alt="" width={16} height={16} />
          </div>
        </div>

        <FooterColumn title="Explore" items={EXPLORE} />
        <FooterColumn title="Policies" items={POLICIES} />

        <div>
          <h6 className={styles.colTitle}>Connect</h6>
          <div className={styles.social}>
            {SOCIAL.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={`Social link ${i + 1}`}
                width={32}
                height={32}
                className={styles.socialIcon}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
