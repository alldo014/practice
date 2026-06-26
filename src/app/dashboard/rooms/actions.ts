"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { createRoom, updateRoom, deleteRoom, RoomError, type RoomInput } from "@/lib/owner-rooms";

export type RoomFormState = { error?: string } | undefined;

const roomSchema = z.object({
  type: z.string().trim().min(2, "Room type is too short.").max(100),
  description: z.string().trim().max(1000).optional().default(""),
  capacity: z.coerce.number().int().min(1).max(20),
  beds: z.coerce.number().int().min(1).max(10),
  basePrice: z.coerce.number().int("Price must be a whole number.").min(1).max(1_000_000_000),
  photos: z.string().default(""),
});

function parsePhotos(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith("/")),
    ),
  ).slice(0, 8);
}

function parseRoom(formData: FormData):
  | { ok: true; input: RoomInput }
  | { ok: false; error: string } {
  const parsed = roomSchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description"),
    capacity: formData.get("capacity"),
    beds: formData.get("beds"),
    basePrice: formData.get("basePrice"),
    photos: formData.get("photos"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid room details." };
  }
  return {
    ok: true,
    input: { ...parsed.data, photos: parsePhotos(parsed.data.photos) },
  };
}

function refresh() {
  revalidatePath("/dashboard/rooms");
  revalidatePath("/hotels");
}

export async function createRoomAction(
  _prev: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await requireRole("tenant_owner");
  if (!user.tenantId) return { error: "Your account isn't linked to a hotel." };

  const result = parseRoom(formData);
  if (!result.ok) return { error: result.error };

  try {
    await createRoom(user.tenantId, result.input);
  } catch (error) {
    if (error instanceof RoomError) return { error: error.message };
    console.error("Create room failed:", error);
    return { error: "Could not create the room." };
  }
  refresh();
  redirect("/dashboard/rooms");
}

export async function updateRoomAction(
  _prev: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await requireRole("tenant_owner");
  if (!user.tenantId) return { error: "Your account isn't linked to a hotel." };
  const roomId = String(formData.get("roomId") ?? "");
  if (!roomId) return { error: "Missing room id." };

  const result = parseRoom(formData);
  if (!result.ok) return { error: result.error };

  try {
    await updateRoom(user.tenantId, roomId, result.input);
  } catch (error) {
    if (error instanceof RoomError) return { error: error.message };
    console.error("Update room failed:", error);
    return { error: "Could not save the room." };
  }
  refresh();
  redirect("/dashboard/rooms");
}

export async function deleteRoomAction(
  _prev: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await requireRole("tenant_owner");
  if (!user.tenantId) return { error: "Your account isn't linked to a hotel." };
  const roomId = String(formData.get("roomId") ?? "");
  if (!roomId) return { error: "Missing room id." };

  try {
    await deleteRoom(user.tenantId, roomId);
  } catch (error) {
    if (error instanceof RoomError) return { error: error.message };
    console.error("Delete room failed:", error);
    return { error: "Could not delete the room." };
  }
  refresh();
  redirect("/dashboard/rooms");
}
