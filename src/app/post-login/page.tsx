import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleHome } from "@/lib/roles";

// Neutral landing after sign-in: route to the right home for the user's role.
export const dynamic = "force-dynamic";

export default async function PostLoginPage() {
  const session = await auth();
  redirect(roleHome(session?.user?.role));
}
