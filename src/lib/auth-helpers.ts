import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Require an authenticated user in a Server Component / route. Redirects to
 * /login when there is no session. Returns the session user otherwise.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/** Require a specific role; redirects home if the user lacks it. */
export async function requireRole(role: "guest" | "tenant_owner" | "admin") {
  const user = await requireUser();
  if (user.role !== role) {
    redirect("/");
  }
  return user;
}
