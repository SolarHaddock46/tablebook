import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb, closeDb } from "./client";

async function run() {
  const db = getDb();
  const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "../drizzle");
  await migrate(db, { migrationsFolder });
  await closeDb();
  process.stdout.write("Migrations complete\n");
}

run().catch(async (error) => {
  process.stderr.write(`${String(error)}\n`);
  await closeDb();
  process.exit(1);
});
