export type Role = "guest" | "tenant_owner" | "admin";

/** Where a user lands after signing in, based on their role. */
export function roleHome(role: Role | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "tenant_owner":
      return "/dashboard";
    default:
      return "/";
  }
}
