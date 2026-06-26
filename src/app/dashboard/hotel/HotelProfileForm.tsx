"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { updateHotelAction, type HotelFormState } from "./actions";
import styles from "./hotel.module.css";

export type HotelProfileValues = {
  slug: string;
  name: string;
  description: string;
  city: string;
  country: string;
  address: string;
  starRating: number;
  coverImage: string;
  amenities: string[];
};

export default function HotelProfileForm({ hotel }: { hotel: HotelProfileValues }) {
  const [state, formAction, pending] = useActionState<HotelFormState, FormData>(
    updateHotelAction,
    undefined,
  );

  return (
    <form action={formAction} className={styles.form}>
      <p className={styles.slug}>
        Public URL: <code>/hotels/{hotel.slug}</code> (slug is fixed)
      </p>

      {state?.error && <p className={styles.error}>{state.error}</p>}
      {state?.ok && <p className={styles.success}>Changes saved.</p>}

      <div className={styles.field}>
        <label htmlFor="name">Hotel name</label>
        <input id="name" name="name" type="text" defaultValue={hotel.name} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={hotel.description} required />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" defaultValue={hotel.city} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="country">Country</label>
          <input id="country" name="country" type="text" defaultValue={hotel.country} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="starRating">Star rating</label>
          <input
            id="starRating"
            name="starRating"
            type="number"
            min={1}
            max={5}
            defaultValue={hotel.starRating}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="address">Address</label>
        <input id="address" name="address" type="text" defaultValue={hotel.address} />
      </div>

      <div className={styles.field}>
        <label htmlFor="coverImage">Cover image path</label>
        <input id="coverImage" name="coverImage" type="text" defaultValue={hotel.coverImage} required />
        <span className={styles.hint}>
          A local path under /public, e.g. /img/explore-1.jpg
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="amenities">Amenities</label>
        <textarea
          id="amenities"
          name="amenities"
          defaultValue={hotel.amenities.join("\n")}
        />
        <span className={styles.hint}>One per line (or comma-separated).</span>
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
