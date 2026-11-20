"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Flight, InkDefs } from "./Card";
import { createListStore, useListStore } from "./listStore";
import { playPop, playTick, playWhoosh } from "./sound";
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

const seenStore = createListStore("vera-seen-v1");
const visitedStore = createListStore("vera-visited-v1");
const stampedStore = createListStore("vera-stamped-v1"); // stamps that already did their thump

export default function WorldMap({ regions }: { regions: Region[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = regions.find((r) => r.id === openId) ?? null;
  const { loaded, set: seen, add: addSeen } = useListStore(seenStore);
  const { set: visited, add: addVisited } = useListStore(visitedStore);
  const { set: stamped, add: addStamped } = useListStore(stampedStore);
  const [flight, setFlight] = useState<{ url: string; x: number; y: number } | null>(null);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const openRegion = (region: Region) => {
    playPop();
    setOpenId(region.id);
    addSeen(region.places.map((p) => p.url));
  };

  const close = useCallback(() => {
    if (busy.current) return; // mid take-off: stay put, the flight finishes
    playTick();
    setOpenId(null);
  }, []);

  const takeOff = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); // the real href still works if this script never runs
    if (busy.current) return;
    busy.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = e.currentTarget.querySelector(".card-go")?.getBoundingClientRect();
    if (!reduced) playWhoosh();
    addVisited([url]);
    setFlight({ url, x: r ? r.left + r.width / 2 : 0, y: r ? r.top + r.height / 2 : 0 });
    timer.current = window.setTimeout(() => window.location.assign(url), reduced ? 150 : 560);
  };

  // Safari may restore this page from its back/forward cache with the animation frozen.
  useEffect(() => {
    const stop = () => window.clearTimeout(timer.current);
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      stop();
      busy.current = false;
      setFlight(null);
    };
    window.addEventListener("pageshow", onShow);
    window.addEventListener("pagehide", stop);
    return () => {
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, close]);

  return (
    <main className="stage">
      <CloudDefs />
      <InkDefs />
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
          <div className="backdrop" data-testid="backdrop" onClick={close} />
          <div
            className={`sheet${flight ? " flying" : ""}`}
            data-testid="sheet"
            style={{ "--count": open.places.length } as React.CSSProperties}
          >
            {open.places.map((place, i) => (
              <Card
                key={place.name}
                place={place}
                n={Math.min(i, 5)}
                visited={visited.has(place.url)}
                stamped={stamped}
                markStamped={addStamped}
                going={flight?.url === place.url}
                onGo={takeOff}
              />
            ))}
          </div>
          <button
            type="button"
            className="close"
            data-testid="close"
            aria-label="close"
            onClick={close}
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
          {flight && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && (
            <Flight x={flight.x} y={flight.y} />
          )}
        </div>
      )}
    </main>
  );
}
