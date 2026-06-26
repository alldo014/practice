import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { applyPaymentStatus } from "@/lib/payments";

/** Constant-time string comparison (avoids token timing leaks). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expected) {
    console.error("XENDIT_WEBHOOK_TOKEN is not configured");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const token = request.headers.get("x-callback-token");
  if (!token || !safeEqual(token, expected)) {
    return NextResponse.json({ error: "Invalid callback token." }, { status: 401 });
  }

  let body: { external_id?: string; status?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { external_id: externalId, status, id: invoiceId } = body;
  if (!externalId || !status) {
    return NextResponse.json({ error: "Missing external_id or status." }, { status: 400 });
  }

  const result = await applyPaymentStatus(externalId, status, invoiceId);
  if (!result.ok) {
    return NextResponse.json({ error: "Unknown booking reference." }, { status: 404 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
