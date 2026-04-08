import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createClient } from "@supabase/supabase-js";

type Restaurant = Record<string, unknown>;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function readRestaurants(): Restaurant[] {
  const fixturesDir = path.join(process.cwd(), "fixtures");
  const gzPath = path.join(fixturesDir, "restaurants.json.gz");
  const jsonPath = path.join(fixturesDir, "restaurants.json");

  if (fs.existsSync(gzPath)) {
    const gz = fs.readFileSync(gzPath);
    const json = zlib.gunzipSync(gz).toString("utf-8");
    return JSON.parse(json) as Restaurant[];
  }
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Restaurant[];
  }
  throw new Error("fixtures/restaurants.json(.gz) was not found. Run generate:restaurants first.");
}

async function run() {
  const supabase = createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const restaurants = readRestaurants();
  const batchSize = 200;

  for (let index = 0; index < restaurants.length; index += batchSize) {
    const batch = restaurants.slice(index, index + batchSize);
    const { error } = await supabase.from("restaurants").upsert(batch, { onConflict: "id" });
    if (error) {
      throw error;
    }
    process.stdout.write(`Inserted batch ${index / batchSize + 1}\n`);
  }
  process.stdout.write("Seed complete\n");
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
