import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import NewTenantForm from "./NewTenantForm";
import consoleStyles from "@/components/console.module.css";

export const metadata: Metadata = { title: "Add a hotel — Admin" };

export default async function NewTenantPage() {
  await requireRole("admin");

  return (
    <>
      <p className="eyebrow">
        <Link href="/admin/tenants">← Hotels &amp; tenants</Link>
      </p>
      <h1 className={consoleStyles.h1}>Add a hotel</h1>
      <p className={consoleStyles.lede}>
        Provisions a new tenant: its own private schema, an initial room, the public listing, and
        an owner account.
      </p>
      <NewTenantForm />
    </>
  );
}
