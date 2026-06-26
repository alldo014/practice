"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { RoomFormState } from "./actions";
import styles from "./rooms.module.css";

export type RoomValues = {
  id: string;
  type: string;
  description: string;
  capacity: number;
  beds: number;
  basePrice: number;
  photos: string[];
};

export default function RoomForm({
  action,
  room,
  submitLabel,
}: {
  action: (state: RoomFormState, formData: FormData) => Promise<RoomFormState>;
  room?: RoomValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RoomFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className={styles.form}>
      {room && <input type="hidden" name="roomId" value={room.id} />}
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label htmlFor="type">Room type</label>
        <input id="type" name="type" type="text" defaultValue={room?.type ?? ""} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={room?.description ?? ""} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="capacity">Capacity (guests)</label>
          <input id="capacity" name="capacity" type="number" min={1} max={20} defaultValue={room?.capacity ?? 2} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="beds">Beds</label>
          <input id="beds" name="beds" type="number" min={1} max={10} defaultValue={room?.beds ?? 1} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="basePrice">Base price / night (IDR)</label>
          <input id="basePrice" name="basePrice" type="number" min={1} step={1} defaultValue={room?.basePrice ?? ""} required />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="photos">Photos</label>
        <textarea id="photos" name="photos" defaultValue={(room?.photos ?? []).join("\n")} />
        <span className={styles.hint}>One local path per line, e.g. /img/explore-1.jpg</span>
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
