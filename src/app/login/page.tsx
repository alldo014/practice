import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./LoginForm";
import styles from "@/components/authForm.module.css";

export const metadata: Metadata = { title: "Sign in — Luxury Stays" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className="eyebrow">Welcome back</p>
        <h1 className={styles.title}>Sign in</h1>
        <LoginForm />
        <p className={styles.alt}>
          Don&rsquo;t have an account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
