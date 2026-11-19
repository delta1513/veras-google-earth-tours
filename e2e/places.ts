import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Place = { name: string; url: string; thumbnail: string | null };
export type Region = { id: string; lat: number; lng: number; places: Place[] };

// Playwright runs from the repo root.
export const ROOT = process.cwd();
export const PLACES_PATH = join(ROOT, "data", "places.json");

export const regions: Region[] = JSON.parse(readFileSync(PLACES_PATH, "utf8")).regions;
