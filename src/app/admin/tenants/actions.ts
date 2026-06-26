"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { setTenantStatus } from "@/lib/admin";

export type TenantActionState = { error?: string } | undefined;

export async function setTenantStatusAction(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await requireRole("admin");

  const tenantId = String(formData.get("tenantId") ?? "");
  const target = formData.get("status") === "suspended" ? "suspended" : "active";
  if (!tenantId) return { error: "Missing tenant id." };

  try {
    await setTenantStatus(tenantId, target);
  } catch (error) {
    console.error("Set tenant status failed:", error);
    return { error: "Could not update the tenant." };
  }

  revalidatePath("/admin/tenants");
  revalidatePath("/hotels");
  return { error: undefined };
}
