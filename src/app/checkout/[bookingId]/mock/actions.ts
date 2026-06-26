"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import {
  applyPaymentStatus,
  encodeExternalId,
  getOwnedBooking,
  isXenditConfigured,
} from "@/lib/payments";

/**
 * Dev-only: simulate a Xendit payment outcome for a booking the user owns.
 * Disabled entirely when a real Xendit key is configured.
 */
export async function simulatePayment(formData: FormData) {
  if (isXenditConfigured()) redirect("/");

  const user = await requireUser();
  const bookingId = String(formData.get("bookingId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  if (!bookingId || !slug) redirect("/");

  // Ownership-checked: throws if the booking isn't this user's.
  const { listing } = await getOwnedBooking(slug, bookingId, user.id);

  const status = outcome === "paid" ? "PAID" : "EXPIRED";
  await applyPaymentStatus(encodeExternalId(listing.schemaName, bookingId), status);

  redirect(`/bookings/${bookingId}/confirmation?h=${encodeURIComponent(slug)}`);
}
