"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { provisionTenantAction, type ProvisionState } from "./actions";
import styles from "./new.module.css";

export default function NewTenantForm() {
  const [state, formAction, pending] = useActionState<ProvisionState, FormData>(
    provisionTenantAction,
    undefined,
  );

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <p className={styles.section}>Hotel details</p>
      <div className={styles.field}>
        <label htmlFor="name">Hotel name</label>
        <input id="name" name="name" type="text" required />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="slug">URL slug</label>
          <input id="slug" name="slug" type="text" placeholder="the-grand-azure" required />
          <span className={styles.hint}>Public URL: /hotels/&lt;slug&gt;</span>
        </div>
        <div className={styles.field}>
          <label htmlFor="starRating">Star rating</label>
          <input id="starRating" name="starRating" type="number" min={1} max={5} defaultValue={5} required />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="country">Country</label>
          <input id="country" name="country" type="text" defaultValue="Indonesia" required />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="coverImage">Cover image path</label>
        <input id="coverImage" name="coverImage" type="text" placeholder="/img/explore-1.jpg" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="amenities">Amenities</label>
        <textarea id="amenities" name="amenities" placeholder="Infinity Pool&#10;Spa&#10;Free WiFi" />
        <span className={styles.hint}>One per line (or comma-separated).</span>
      </div>

      <p className={styles.section}>Starter room</p>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="roomType">Room type</label>
          <input id="roomType" name="roomType" type="text" placeholder="Deluxe Room" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="roomBasePrice">Price / night (IDR)</label>
          <input id="roomBasePrice" name="roomBasePrice" type="number" min={1} required />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="roomCapacity">Capacity</label>
          <input id="roomCapacity" name="roomCapacity" type="number" min={1} max={20} defaultValue={2} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="roomBeds">Beds</label>
          <input id="roomBeds" name="roomBeds" type="number" min={1} max={10} defaultValue={1} required />
        </div>
      </div>

      <p className={styles.section}>Owner account</p>
      <div className={styles.field}>
        <label htmlFor="ownerName">Owner name</label>
        <input id="ownerName" name="ownerName" type="text" required />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="ownerEmail">Owner email</label>
          <input id="ownerEmail" name="ownerEmail" type="email" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="ownerPassword">Owner password</label>
          <input id="ownerPassword" name="ownerPassword" type="password" minLength={8} required />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating hotel…" : "Create hotel"}
        </Button>
      </div>
    </form>
  );
}
