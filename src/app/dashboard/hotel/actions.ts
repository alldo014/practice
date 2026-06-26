"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { updateOwnerHotel } from "@/lib/owner";

export type HotelFormState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  description: z.string().trim().min(10, "Description is too short.").max(2000),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).optional().default(""),
  starRating: z.coerce.number().int().min(1).max(5),
  coverImage: z
    .string()
    .trim()
    .min(1, "Cover image is required.")
    .max(300)
    .refine((v) => v.startsWith("/"), "Use a local path like /img/explore-1.jpg"),
  amenities: z.string().default(""),
});

export async function updateHotelAction(
  _prev: HotelFormState,
  formData: FormData,
): Promise<HotelFormState> {
  const user = await requireRole("tenant_owner");
  if (!user.tenantId) return { error: "Your account isn't linked to a hotel." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    city: formData.get("city"),
    country: formData.get("country"),
    address: formData.get("address"),
    starRating: formData.get("starRating"),
    coverImage: formData.get("coverImage"),
    amenities: formData.get("amenities"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const amenities = Array.from(
    new Set(
      parsed.data.amenities
        .split(/[\n,]/)
        .map((a) => a.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);

  try {
    const { slug } = await updateOwnerHotel(user.tenantId, { ...parsed.data, amenities });
    // Refresh the owner view and the public pages reading the catalog.
    revalidatePath("/dashboard/hotel");
    revalidatePath("/hotels");
    revalidatePath(`/hotels/${slug}`);
    return { ok: true };
  } catch (error) {
    console.error("Hotel update failed:", error);
    return { error: "Could not save your changes." };
  }
}
