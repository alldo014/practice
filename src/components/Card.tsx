import type { ReactNode } from "react";
import styles from "./Card.module.css";

/** White surface with the luxury card border + soft shadow. */
export default function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={[styles.card, className].filter(Boolean).join(" ")}>{children}</div>;
}
