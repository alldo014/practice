import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createCheckout, PaymentError } from "@/lib/payments";

const checkoutSchema = z.object({
  bookingId: z.string().min(1),
  slug: z.string().min(1),
});

const ERROR_STATUS: Record<PaymentError["code"], number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INVALID: 400,
  PROVIDER: 502,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  try {
    const { redirectUrl } = await createCheckout({
      user: { id: session.user.id, email: session.user.email },
      slug: parsed.data.slug,
      bookingId: parsed.data.bookingId,
    });
    return NextResponse.json({ redirectUrl }, { status: 200 });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ error: error.message }, { status: ERROR_STATUS[error.code] });
    }
    console.error("Checkout failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
