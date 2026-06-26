"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { cancelOwnerBooking, OwnerBookingError } from "@/lib/owner-bookings";

export type CancelState = { error?: string } | undefined;

export async function cancelBookingAction(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const user = await requireRole("tenant_owner");
  if (!user.tenantId) return { error: "Your account isn't linked to a hotel." };
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Missing booking id." };

  try {
    await cancelOwnerBooking(user.tenantId, bookingId);
  } catch (error) {
    if (error instanceof OwnerBookingError) return { error: error.message };
    console.error("Cancel booking failed:", error);
    return { error: "Could not cancel the booking." };
  }

  revalidatePath("/dashboard/bookings");
  return { error: undefined };
}
