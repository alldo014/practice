import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const SCHEMA_NAME_RE = /^tenant_[a-z0-9_]+$/;

/**
 * The per-tenant table DDL, generated from prisma/tenant.prisma via
 * `npm run prisma:tenant:ddl`. Read lazily (on first provision) and cached.
 * The template's `CREATE SCHEMA "public"` line is dropped — we create the
 * tenant schema ourselves and apply the tables into it.
 */
let templateDdl: string | null = null;
function getTemplateDdl(): string {
  if (templateDdl === null) {
    templateDdl = readFileSync(join(process.cwd(), "prisma", "tenant-template.sql"), "utf8")
      .split("\n")
      .filter((line) => !/CREATE SCHEMA IF NOT EXISTS "public"/.test(line))
      .join("\n");
  }
  return templateDdl;
}

/** DATABASE_URL with query params stripped — pg uses the search_path we SET. */
function baseConnectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const url = new URL(raw);
  url.search = "";
  return url.toString();
}

/**
 * Create a tenant's private schema (`tenant_<...>`) and apply the per-tenant
 * table template into it. With `reset`, drops any existing schema first (used
 * by the seed for idempotency). All statements run on one dedicated connection
 * so the SET search_path persists across the multi-statement DDL.
 */
export async function provisionTenantSchema(
  schemaName: string,
  opts: { reset?: boolean } = {},
): Promise<void> {
  if (!SCHEMA_NAME_RE.test(schemaName)) {
    throw new Error(`Invalid tenant schema name: ${schemaName}`);
  }

  const client = new Client({ connectionString: baseConnectionString() });
  await client.connect();
  try {
    if (opts.reset) {
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query(getTemplateDdl());
  } finally {
    await client.end();
  }
}
