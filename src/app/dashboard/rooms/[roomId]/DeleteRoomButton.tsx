"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { deleteRoomAction, type RoomFormState } from "../actions";
import styles from "../rooms.module.css";

export default function DeleteRoomButton({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState<RoomFormState, FormData>(
    deleteRoomAction,
    undefined,
  );

  return (
    <div className={styles.danger}>
      <p className={styles.dangerTitle}>Delete room</p>
      {state?.error && <p className={styles.error}>{state.error}</p>}
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Delete this room? This can't be undone.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="roomId" value={roomId} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Deleting…" : "Delete this room"}
        </Button>
      </form>
    </div>
  );
}
