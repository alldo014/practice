// Relative import (not the @/ alias) so this resolves under both Next.js and
// the tsx-based seed script without depending on tsconfig path resolution.
import { PrismaClient as TenantPrismaClient } from "../generated/tenant";

// Schema names are interpolated into a connection string, so they must be
// strictly validated to prevent pointing a client at an arbitrary schema.
const SCHEMA_NAME_RE = /^tenant_[a-z0-9_]+$/;

// One client per tenant schema, cached so repeated requests reuse connections.
// Cached on globalThis so Next.js dev hot-reload doesn't leak clients.
const globalForTenant = globalThis as unknown as {
  tenantClients: Map<string, TenantPrismaClient> | undefined;
};

const tenantClients =
  globalForTenant.tenantClients ?? new Map<string, TenantPrismaClient>();

if (process.env.NODE_ENV !== "production") {
  globalForTenant.tenantClients = tenantClients;
}

export function isValidTenantSchema(schemaName: string): boolean {
  return SCHEMA_NAME_RE.test(schemaName);
}

/** Build the base DATABASE_URL with its `schema` query param set to `schemaName`. */
export function tenantConnectionUrl(schemaName: string): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set");
  const url = new URL(base);
  url.searchParams.set("schema", schemaName);
  return url.toString();
}

/**
 * Return a Prisma client scoped to a tenant's private schema (`tenant_<...>`).
 * Clients are cached per schema. Throws on an invalid/unsafe schema name.
 */
export function getTenantDb(schemaName: string): TenantPrismaClient {
  if (!isValidTenantSchema(schemaName)) {
    throw new Error(`Invalid tenant schema name: ${schemaName}`);
  }

  const cached = tenantClients.get(schemaName);
  if (cached) return cached;

  const client = new TenantPrismaClient({
    datasources: { db: { url: tenantConnectionUrl(schemaName) } },
  });
  tenantClients.set(schemaName, client);
  return client;
}

/** Disconnect and drop all cached tenant clients (used by scripts/tests). */
export async function disconnectAllTenantDbs(): Promise<void> {
  await Promise.all([...tenantClients.values()].map((c) => c.$disconnect()));
  tenantClients.clear();
}
