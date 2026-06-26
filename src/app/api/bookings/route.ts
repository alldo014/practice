import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createBooking, BookingError } from "@/lib/bookings";

const bookingSchema = z.object({
  slug: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date."),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date."),
  guests: z.coerce.number().int().min(1).max(20),
});

const ERROR_STATUS: Record<BookingError["code"], number> = {
  NOT_FOUND: 404,
  INVALID: 400,
  CONFLICT: 409,
};

/** Postgres serialization failure (concurrent booking race) → retryable conflict. */
function isSerializationFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "You must be signed in to book." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking details." },
      { status: 400 },
    );
  }

  try {
    const result = await createBooking({
      user: { id: session.user.id, email: session.user.email },
      ...parsed.data,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: ERROR_STATUS[error.code] });
    }
    if (isSerializationFailure(error)) {
      return NextResponse.json(
        { error: "Those dates were just booked by someone else. Please try again." },
        { status: 409 },
      );
    }
    console.error("Booking creation failed:", error);
    return NextResponse.json({ error: "Something went wrong creating your booking." }, { status: 500 });
  }
}
