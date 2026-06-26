"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { cancelBookingAction, type CancelState } from "./actions";

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [, formAction, pending] = useActionState<CancelState, FormData>(
    cancelBookingAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Cancel this booking? The dates will be released.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel"}
      </Button>
    </form>
  );
}
