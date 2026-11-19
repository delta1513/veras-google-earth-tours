"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MAP_ASPECT, MAP_HEIGHT, MAP_WIDTH, project } from "./map";
import type { Region } from "./places";

// 4-point twinkle star, 24x24 box.
const STAR = "M12 1 C12.8 8 16 11.2 23 12 C16 12.8 12.8 16 12 23 C11.2 16 8 12.8 1 12 C8 11.2 11.2 8 12 1 Z";

// Stars around the pin head (head centre is 14.5/40 of the way down the icon box).
const SPARKS = [
  { x: -27, y: 0, s: 18, d: 0 },
  { x: 27, y: -6, s: 15, d: 0.9 },
  { x: 2, y: -22, s: 20, d: 1.7 },
  { x: -20, y: 30, s: 13, d: 0.5 },
  { x: 24, y: 28, s: 14, d: 1.3 },
];

function Sparkles() {
  return (
    <span className="sparkles" aria-hidden="true">
      <span className="halo" />
      {SPARKS.map((k, i) => (
        <svg
          key={i}
          className="spark"
          viewBox="0 0 24 24"
          style={
            {
              left: `calc(50% + ${k.x}px)`,
              top: `${k.y + 4}px`,
              width: k.s,
              height: k.s,
              "--sd": `${k.d}s`,
            } as React.CSSProperties
          }
        >
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

function PinIcon() {
  // Pin tip is at the bottom centre of this 40x40 box.
  return (
    <svg className="pin-icon" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <path
        d="M20 39 C20 39 5 24 5 14.5 C5 6.5 11.7 1 20 1 C28.3 1 35 6.5 35 14.5 C35 24 20 39 20 39 Z"
        fill="#e5252a"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="14.5" r="6" fill="#ffffff" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <path
        d="M8 24 H34 M23 11 L36 24 L23 37"
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Soft illustrated cloud: a flat-bottomed puffy shape with a shaded underside.
function CloudDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="cloud-shape" viewBox="0 0 240 110">
          <path
            d="M44 88 C16 88 8 62 30 54 C28 36 52 28 66 40 C72 14 112 8 128 30 C144 16 178 24 180 48 C208 44 228 66 210 84 C206 88 200 88 196 88 Z"
            fill="#ffffff"
          />
          <path
            d="M44 88 C16 88 8 62 30 54 C28 36 52 28 66 40 C72 14 112 8 128 30 C144 16 178 24 180 48 C208 44 228 66 210 84 C206 88 200 88 196 88 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <path
            d="M34 78 C70 90 150 92 214 78 C212 86 204 88 196 88 L44 88 C36 88 30 84 34 78 Z"
            fill="#cfe3f3"
          />
        </symbol>
      </defs>
    </svg>
  );
}

const CLOUDS = [
  { top: 6, w: 17, dur: 120, delay: -20, op: 0.9 },
  { top: 26, w: 12, dur: 90, delay: -62, op: 0.8 },
  { top: 48, w: 20, dur: 140, delay: -95, op: 0.85 },
  { top: 66, w: 13, dur: 100, delay: -35, op: 0.8 },
  { top: 82, w: 16, dur: 130, delay: -8, op: 0.85 },
];

function Clouds() {
  return (
    <div className="clouds" aria-hidden="true">
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          className="cloud"
          viewBox="0 0 240 110"
          style={
            {
              top: `${c.top}%`,
              width: `${c.w}%`,
              opacity: c.op,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            } as React.CSSProperties
          }
        >
          <use href="#cloud-shape" />
        </svg>
      ))}
    </div>
  );
}

const SEEN_KEY = "vera-seen-v1";
const mem: { seen: string | null } = { seen: null }; // fallback when storage is unavailable
const seenListeners = new Set<() => void>();
function subscribeSeen(cb: () => void) {
  seenListeners.add(cb);
  return () => {
    seenListeners.delete(cb);
  };
}
function writeSeen(value: string) {
  mem.seen = value;
  try {
    window.localStorage.setItem(SEEN_KEY, value);
  } catch {
    /* ignore */
  }
  seenListeners.forEach((l) => l());
}
function readSeen(): string {
  if (mem.seen !== null) return mem.seen;
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function WorldMap({ regions }: { regions: Region[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = regions.find((r) => r.id === openId) ?? null;
  // URLs Vera has already seen (raw JSON string; null until mounted, so no hydration mismatch).
  const raw = useSyncExternalStore(subscribeSeen, readSeen, () => null);
  const loaded = raw !== null;
  const seen = useMemo(() => {
    try {
      const arr: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) return new Set(arr.filter((u): u is string => typeof u === "string"));
    } catch {
      /* ignore */
    }
    return new Set<string>();
  }, [raw]);

  const openRegion = (region: Region) => {
    setOpenId(region.id);
    if (region.places.every((p) => seen.has(p.url))) return;
    const next = new Set(seen);
    region.places.forEach((p) => next.add(p.url));
    writeSeen(JSON.stringify([...next]));
  };

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <main className="stage">
      <CloudDefs />
      <div
        className="map"
        data-testid="map"
        style={{ "--map-aspect": MAP_ASPECT } as React.CSSProperties}
      >
        <Image
          className="map-img"
          src="/world.svg"
          alt=""
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          priority
          unoptimized
          draggable={false}
        />
        <Clouds />
        <div className="map-frame" aria-hidden="true" />
        {regions.map((region, i) => {
          const { xPct, yPct } = project(region.lat, region.lng);
          const isNew = region.places.some((p) => !seen.has(p.url));
          return (
            <button
              key={region.id}
              type="button"
              className="pin"
              data-testid="pin"
              data-region={region.id}
              data-new={isNew ? "true" : "false"}
              aria-label={region.id}
              style={
                {
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  "--i": i,
                  "--bd": `${((i * 37) % 17) / 6}s`,
                } as React.CSSProperties
              }
              onClick={() => openRegion(region)}
            >
              <span className="pin-ground" aria-hidden="true">
                <span className="pin-shadow" />
                <span className="pin-ripple" />
              </span>
              <span className="pin-drop" aria-hidden="true">
                <span className="pin-bob">
                  <span className={`sparkle-wrap${loaded && isNew ? " on" : ""}`}>
                    <Sparkles />
                  </span>
                  <PinIcon />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="overlay" data-testid="overlay" data-region={open.id}>
          <div className="backdrop" data-testid="backdrop" onClick={() => setOpenId(null)} />
          <div className="sheet" data-testid="sheet">
            {open.places.map((place, i) => (
              <a
                key={place.name}
                className="card"
                data-testid="card"
                href={place.url}
                style={{ "--n": Math.min(i, 5) } as React.CSSProperties}
              >
                {place.thumbnail ? (
                  <Image
                    className="thumb"
                    src={place.thumbnail}
                    alt=""
                    width={96}
                    height={96}
                    unoptimized
                  />
                ) : (
                  <span className="thumb placeholder" data-testid="placeholder" />
                )}
                <span className="card-name">{place.name}</span>
                <span className="card-go">
                  <ArrowIcon />
                </span>
              </a>
            ))}
          </div>
          <button
            type="button"
            className="close"
            data-testid="close"
            aria-label="close"
            onClick={() => setOpenId(null)}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 5 L19 19 M19 5 L5 19"
                stroke="#ffffff"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
