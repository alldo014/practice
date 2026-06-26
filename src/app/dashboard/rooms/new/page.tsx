import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { createRoomAction } from "../actions";
import RoomForm from "../RoomForm";
import consoleStyles from "@/components/console.module.css";
import styles from "../rooms.module.css";

export const metadata: Metadata = { title: "Add room — Dashboard" };

export default async function NewRoomPage() {
  await requireRole("tenant_owner");

  return (
    <>
      <p className="eyebrow">
        <Link href="/dashboard/rooms">← Rooms</Link>
      </p>
      <h1 className={consoleStyles.h1}>Add a room</h1>
      <p className={consoleStyles.lede}>New rooms become bookable immediately.</p>
      <RoomForm action={createRoomAction} submitLabel="Create room" />
      <div className={styles.hint} />
    </>
  );
}
