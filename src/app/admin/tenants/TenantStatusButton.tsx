"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { setTenantStatusAction, type TenantActionState } from "./actions";

export default function TenantStatusButton({
  tenantId,
  status,
}: {
  tenantId: string;
  status: "active" | "suspended";
}) {
  const [, formAction, pending] = useActionState<TenantActionState, FormData>(
    setTenantStatusAction,
    undefined,
  );

  const suspending = status === "active";
  const target = suspending ? "suspended" : "active";
  const verb = suspending ? "Suspend" : "Activate";

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const msg = suspending
          ? "Suspend this hotel? It will disappear from public search and detail pages."
          : "Re-activate this hotel and publish it again?";
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="status" value={target} />
      <Button type="submit" variant={suspending ? "outline" : "primary"} disabled={pending}>
        {pending ? "…" : verb}
      </Button>
    </form>
  );
}
