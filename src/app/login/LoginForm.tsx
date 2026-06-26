"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { login, type AuthFormState } from "@/app/actions/auth";
import styles from "@/components/authForm.module.css";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(login, undefined);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button type="submit" block disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
