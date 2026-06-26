import { prisma } from "./db";
import { getTenantDb, isValidTenantSchema } from "./tenant-db";
import { getXenditClient, isXenditConfigured } from "./xendit";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export type PaymentErrorCode = "NOT_FOUND" | "FORBIDDEN" | "INVALID" | "PROVIDER";

export class PaymentError extends Error {
  code: PaymentErrorCode;
  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "PaymentError";
  }
}

// Xendit only knows our `external_id`. Encode the tenant schema + booking id into
// it so the webhook (which has no session/tenant context) can route the update.
export function encodeExternalId(schemaName: string, bookingId: string): string {
  return `${schemaName}:${bookingId}`;
}

export function decodeExternalId(externalId: string): { schemaName: string; bookingId: string } | null {
  const idx = externalId.indexOf(":");
  if (idx <= 0) return null;
  const schemaName = externalId.slice(0, idx);
  const bookingId = externalId.slice(idx + 1);
  if (!isValidTenantSchema(schemaName) || !bookingId) return null;
  return { schemaName, bookingId };
}

/** Resolve a booking (with room) by slug + id, asserting it belongs to the user. */
export async function getOwnedBooking(slug: string, bookingId: string, userId: string) {
  const listing = await prisma.hotelListing.findUnique({ where: { slug } });
  if (!listing) throw new PaymentError("NOT_FOUND", "Hotel not found.");

  const tenantDb = getTenantDb(listing.schemaName);
  const booking = await tenantDb.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) throw new PaymentError("NOT_FOUND", "Booking not found.");
  if (booking.guestId !== userId) throw new PaymentError("FORBIDDEN", "This is not your booking.");

  return { listing, booking };
}

export function confirmationUrl(bookingId: string, slug: string): string {
  return `${BASE_URL}/bookings/${bookingId}/confirmation?h=${encodeURIComponent(slug)}`;
}

/**
 * Create (or reuse) a payment for a pending booking: a Xendit hosted invoice in
 * production, or a local mock checkout page when no real key is configured.
 * Persists a Payment row in the tenant schema and returns the URL to redirect to.
 */
export async function createCheckout(input: {
  user: { id: string; email: string };
  slug: string;
  bookingId: string;
}): Promise<{ redirectUrl: string }> {
  const { user, slug, bookingId } = input;
  const { listing, booking } = await getOwnedBooking(slug, bookingId, user.id);
  const tenantDb = getTenantDb(listing.schemaName);

  if (booking.paymentStatus === "paid") {
    return { redirectUrl: confirmationUrl(booking.id, slug) };
  }
  if (booking.status === "cancelled") {
    throw new PaymentError("INVALID", "This booking has been cancelled.");
  }

  const externalId = encodeExternalId(listing.schemaName, booking.id);
  const amount = Number(booking.totalAmount);
  const successUrl = confirmationUrl(booking.id, slug);

  let redirectUrl: string;
  let invoiceId: string;

  if (isXenditConfigured()) {
    try {
      const { Invoice } = getXenditClient();
      const invoice = await Invoice.createInvoice({
        data: {
          externalId,
          amount,
          currency: booking.currency,
          payerEmail: user.email,
          description: `Booking ${booking.id} — ${booking.room.type} at ${listing.name}`,
          successRedirectUrl: successUrl,
          failureRedirectUrl: successUrl,
          invoiceDuration: 86400,
        },
      });
      redirectUrl = invoice.invoiceUrl;
      invoiceId = invoice.id ?? externalId;
    } catch (err) {
      console.error("Xendit invoice creation failed:", err);
      throw new PaymentError("PROVIDER", "Could not reach the payment provider. Please try again.");
    }
  } else {
    // Dev fallback: local mock hosted-checkout page (no real Xendit key configured).
    redirectUrl = `${BASE_URL}/checkout/${booking.id}/mock?h=${encodeURIComponent(slug)}`;
    invoiceId = `mock_${booking.id}`;
  }

  await tenantDb.payment.upsert({
    where: { bookingId: booking.id },
    update: { xenditInvoiceId: invoiceId, amount: booking.totalAmount, currency: booking.currency, status: "pending" },
    create: {
      bookingId: booking.id,
      xenditInvoiceId: invoiceId,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: "pending",
    },
  });

  return { redirectUrl };
}

/**
 * Apply a payment result to the booking + payment in the right tenant schema.
 * Used by the Xendit webhook and the dev mock. `externalId` carries the schema.
 */
export async function applyPaymentStatus(
  externalId: string,
  xenditStatus: string,
  invoiceId?: string,
): Promise<{ ok: boolean }> {
  const decoded = decodeExternalId(externalId);
  if (!decoded) return { ok: false };

  const tenantDb = getTenantDb(decoded.schemaName);
  const status = xenditStatus.toUpperCase();
  const paid = status === "PAID" || status === "SETTLED";
  const failed = status === "EXPIRED" || status === "FAILED";

  const paymentStatus = paid ? "paid" : failed ? "failed" : "pending";
  const bookingStatus = paid ? "confirmed" : failed ? "cancelled" : "pending";

  // Booking must exist in this schema; missing → not ours / bad id.
  const booking = await tenantDb.booking.findUnique({ where: { id: decoded.bookingId } });
  if (!booking) return { ok: false };

  await tenantDb.payment.updateMany({
    where: { bookingId: decoded.bookingId },
    data: { status: paymentStatus, ...(invoiceId ? { xenditInvoiceId: invoiceId } : {}) },
  });
  await tenantDb.booking.update({
    where: { id: decoded.bookingId },
    data: { paymentStatus, status: bookingStatus },
  });

  return { ok: true };
}

export { isXenditConfigured };
