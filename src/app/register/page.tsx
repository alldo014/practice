import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RegisterForm from "./RegisterForm";
import styles from "@/components/authForm.module.css";

export const metadata: Metadata = { title: "Create account — Luxury Stays" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className="eyebrow">Join us</p>
        <h1 className={styles.title}>Create your account</h1>
        <RegisterForm />
        <p className={styles.alt}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
