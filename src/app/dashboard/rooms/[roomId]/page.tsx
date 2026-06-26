import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { getOwnerRoom } from "@/lib/owner-rooms";
import { updateRoomAction } from "../actions";
import RoomForm from "../RoomForm";
import DeleteRoomButton from "./DeleteRoomButton";
import consoleStyles from "@/components/console.module.css";

export const metadata: Metadata = { title: "Edit room — Dashboard" };
export const dynamic = "force-dynamic";

type Params = Promise<{ roomId: string }>;

export default async function EditRoomPage({ params }: { params: Params }) {
  const user = await requireRole("tenant_owner");
  const { roomId } = await params;

  const room = await getOwnerRoom(user.tenantId!, roomId);
  if (!room) notFound();

  return (
    <>
      <p className="eyebrow">
        <Link href="/dashboard/rooms">← Rooms</Link>
      </p>
      <h1 className={consoleStyles.h1}>Edit room</h1>

      <RoomForm
        action={updateRoomAction}
        submitLabel="Save changes"
        room={{
          id: room.id,
          type: room.type,
          description: room.description ?? "",
          capacity: room.capacity,
          beds: room.beds,
          basePrice: Number(room.basePrice),
          photos: room.photos,
        }}
      />

      <DeleteRoomButton roomId={room.id} />
    </>
  );
}
