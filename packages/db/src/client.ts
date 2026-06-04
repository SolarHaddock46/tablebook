import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index";
import { loadEnv } from "./load-env";

function getDatabaseUrl(): string {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing env var: DATABASE_URL. Copy .env.example to apps/api/.env.local or set DATABASE_URL in the shell."
    );
  }
  return url;
}

type DbGlobal = {
  tablebookSql?: ReturnType<typeof postgres>;
  tablebookDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const globalForDb = globalThis as typeof globalThis & DbGlobal;

export function getDb() {
  if (!globalForDb.tablebookDb) {
    globalForDb.tablebookSql = postgres(getDatabaseUrl(), {
      max: Pool.maxConnections,
      idle_timeout: Pool.idleTimeoutSeconds,
      max_lifetime: Pool.maxLifetimeSeconds
    });
    globalForDb.tablebookDb = drizzle(globalForDb.tablebookSql, { schema });
  }
  return globalForDb.tablebookDb;
}

export async function closeDb() {
  if (globalForDb.tablebookSql) {
    await globalForDb.tablebookSql.end();
    globalForDb.tablebookSql = undefined;
    globalForDb.tablebookDb = undefined;
  }
}

enum Pool {
  maxConnections = 5,
  idleTimeoutSeconds = 20,
  maxLifetimeSeconds = 60 * 30
}

export { schema };
