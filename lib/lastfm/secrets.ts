import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { LastFmSecrets } from "./types";

const SECRETS_PATH = join(process.cwd(), "secrets/lastfm_secrets.json");

export async function loadLastFmSecrets(): Promise<LastFmSecrets> {
  const raw = await readFile(SECRETS_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!isLastFmSecrets(parsed)) {
    throw new Error(
      "secrets/lastfm_secrets.json must be an object with api_key and api_secret strings",
    );
  }

  return parsed;
}

function isLastFmSecrets(value: unknown): value is LastFmSecrets {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.api_key === "string" &&
    record.api_key.length > 0 &&
    typeof record.api_secret === "string"
  );
}
