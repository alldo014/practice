import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-helpers";
import { getOwnerHotel } from "@/lib/owner";
import HotelProfileForm from "./HotelProfileForm";
import consoleStyles from "@/components/console.module.css";

export const metadata: Metadata = { title: "Hotel profile — Dashboard" };
export const dynamic = "force-dynamic";

export default async function HotelProfilePage() {
  const user = await requireRole("tenant_owner");
  const data = await getOwnerHotel(user.tenantId);

  if (!data || !data.hotel) {
    return (
      <>
        <h1 className={consoleStyles.h1}>Hotel profile</h1>
        <div className={consoleStyles.empty}>No hotel is linked to your account.</div>
      </>
    );
  }

  const { hotel } = data;

  return (
    <>
      <p className="eyebrow">Hotel profile</p>
      <h1 className={consoleStyles.h1}>{hotel.name}</h1>
      <p className={consoleStyles.lede}>Edit how your hotel appears across the platform.</p>

      <HotelProfileForm
        hotel={{
          slug: hotel.slug,
          name: hotel.name,
          description: hotel.description,
          city: hotel.city,
          country: hotel.country,
          address: hotel.address ?? "",
          starRating: hotel.starRating,
          coverImage: hotel.coverImage,
          amenities: hotel.amenities,
        }}
      />
    </>
  );
}
