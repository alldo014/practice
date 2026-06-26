import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { requireRole } from "@/lib/auth-helpers";
import { listOwnerRooms } from "@/lib/owner-rooms";
import { formatIDR } from "@/lib/format";
import consoleStyles from "@/components/console.module.css";
import styles from "./rooms.module.css";

export const metadata: Metadata = { title: "Rooms & rates — Dashboard" };
export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const user = await requireRole("tenant_owner");
  const data = await listOwnerRooms(user.tenantId!);

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <p className="eyebrow">Rooms &amp; rates</p>
          <h1 className={consoleStyles.h1}>Rooms</h1>
        </div>
        <Button href="/dashboard/rooms/new">Add room</Button>
      </div>

      {data.rooms.length === 0 ? (
        <div className={consoleStyles.empty}>
          No rooms yet. Add your first room to start taking bookings.
        </div>
      ) : (
        <div className={styles.list}>
          {data.rooms.map((room) => (
            <Card key={room.id} className={styles.room}>
              <div>
                <div className={styles.roomType}>{room.type}</div>
                <div className={styles.roomMeta}>
                  Sleeps {room.capacity} · {room.beds} {room.beds === 1 ? "bed" : "beds"}
                </div>
              </div>
              <div className={styles.roomPrice}>{formatIDR(room.basePrice)} / night</div>
              <Link href={`/dashboard/rooms/${room.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
