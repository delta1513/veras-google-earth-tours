import { expect, test } from "@playwright/test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { regions, ROOT } from "./places";

const MIN_PIN_DISTANCE_DEG = 8; // pins closer than this (lat/lng, Euclidean) could overlap on the map
const MAX_THUMB_BYTES = 40 * 1024; // keep thumbnails small for fast loading
const THUMB_SIZE = 256; // thumbnails are exactly 256x256 px

const EARTH_URL =
  /^https:\/\/earth\.google\.com\/web\/@-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?a,\d+(\.\d+)?d,\d+(\.\d+)?y,\d+(\.\d+)?h,\d+(\.\d+)?t,\d+(\.\d+)?r$/;

/** Reads width/height from a JPEG's start-of-frame marker; null if it is not a JPEG. */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xff) { i++; continue; } // fill byte
    const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSOF) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

test("region ids are unique kebab-case and every region has places", () => {
  const ids = regions.map((r) => r.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const r of regions) {
    expect(r.id, r.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(r.places.length, `${r.id} has no places`).toBeGreaterThanOrEqual(1);
  }
});

test("coordinates are on the map and pins never overlap", () => {
  for (const r of regions) {
    expect(r.lat, `${r.id} lat`).toBeGreaterThanOrEqual(-58);
    expect(r.lat, `${r.id} lat`).toBeLessThanOrEqual(84);
    expect(r.lng, `${r.id} lng`).toBeGreaterThanOrEqual(-180);
    expect(r.lng, `${r.id} lng`).toBeLessThanOrEqual(180);
  }
  for (const [i, a] of regions.entries()) {
    for (const b of regions.slice(i + 1)) {
      const d = Math.hypot(a.lat - b.lat, a.lng - b.lng);
      expect(d, `${a.id} and ${b.id} are too close`).toBeGreaterThanOrEqual(MIN_PIN_DISTANCE_DEG);
    }
  }
});

test("places: names are 1-2 words and unique per region, urls are Google Earth links", () => {
  for (const r of regions) {
    const names = r.places.map((p) => p.name);
    expect(new Set(names).size, `${r.id} has duplicate names`).toBe(names.length);
    for (const p of r.places) {
      expect(p.name.trim(), `${r.id} name`).toBe(p.name);
      const words = p.name.split(/\s+/).filter(Boolean);
      expect(words.length, `${r.id}/${p.name} word count`).toBeGreaterThanOrEqual(1);
      expect(words.length, `${r.id}/${p.name} word count`).toBeLessThanOrEqual(2);
      expect(p.url, `${r.id}/${p.name} url`).toMatch(EARTH_URL);
    }
  }
});

test("thumbnails exist, are 256x256 JPEGs, and are small", () => {
  for (const r of regions) {
    for (const p of r.places) {
      if (p.thumbnail === null) continue;
      const label = `${r.id}/${p.name}`;
      expect(p.thumbnail, label).toMatch(/^\/thumbs\/[^/]+$/);
      const file = join(ROOT, "public", p.thumbnail);
      expect(existsSync(file), `${label}: ${file} is missing`).toBe(true);
      expect(statSync(file).size, `${label} size`).toBeLessThanOrEqual(MAX_THUMB_BYTES);
      expect(jpegSize(readFileSync(file)), `${label} must be a ${THUMB_SIZE}x${THUMB_SIZE} JPEG`).toEqual({
        width: THUMB_SIZE,
        height: THUMB_SIZE,
      });
    }
  }
});
