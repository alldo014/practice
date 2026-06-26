"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { register, type AuthFormState } from "@/app/actions/auth";
import styles from "@/components/authForm.module.css";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(register, undefined);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}
      <div className={styles.field}>
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" block disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
