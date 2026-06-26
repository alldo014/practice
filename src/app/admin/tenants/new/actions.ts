"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { provisionNewTenant, ProvisionError } from "@/lib/admin-provision";

export type ProvisionState = { error?: string } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "Hotel name is too short.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, and hyphens only."),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10, "Description is too short.").max(2000),
  starRating: z.coerce.number().int().min(1).max(5),
  coverImage: z
    .string()
    .trim()
    .min(1)
    .refine((v) => v.startsWith("/"), "Use a local path like /img/explore-1.jpg"),
  amenities: z.string().default(""),
  ownerName: z.string().trim().min(2, "Owner name is too short.").max(120),
  ownerEmail: z.string().trim().toLowerCase().email("Enter a valid owner email."),
  ownerPassword: z.string().min(8, "Owner password must be at least 8 characters."),
  roomType: z.string().trim().min(2, "Room type is too short.").max(100),
  roomCapacity: z.coerce.number().int().min(1).max(20),
  roomBeds: z.coerce.number().int().min(1).max(10),
  roomBasePrice: z.coerce.number().int().min(1).max(1_000_000_000),
});

export async function provisionTenantAction(
  _prev: ProvisionState,
  formData: FormData,
): Promise<ProvisionState> {
  await requireRole("admin");

  const parsed = schema.safeParse(Object.fromEntries(formData));
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

  let slug: string;
  try {
    const result = await provisionNewTenant({ ...parsed.data, amenities });
    slug = result.slug;
  } catch (error) {
    if (error instanceof ProvisionError) return { error: error.message };
    console.error("Provision action failed:", error);
    return { error: "Could not create the hotel." };
  }

  revalidatePath("/admin/tenants");
  revalidatePath("/hotels");
  redirect(`/hotels/${slug}`);
}
