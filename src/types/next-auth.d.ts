import type { DefaultSession } from "next-auth";

type Role = "guest" | "tenant_owner" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      tenantId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    tenantId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    tenantId: string | null;
  }
}
