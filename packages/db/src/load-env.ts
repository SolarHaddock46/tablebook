import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

function parseEnvFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadEnv() {
  if (loaded) {
    return;
  }
  loaded = true;

  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const monorepoRoot = path.resolve(packageRoot, "../..");

  const candidates = [
    path.join(monorepoRoot, ".env.local"),
    path.join(monorepoRoot, ".env"),
    path.join(monorepoRoot, "apps/api/.env.local"),
    path.join(monorepoRoot, "apps/api/.env"),
    path.join(packageRoot, ".env.local"),
    path.join(packageRoot, ".env")
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    parseEnvFile(filePath);
  }
}
