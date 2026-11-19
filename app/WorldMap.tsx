"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MAP_ASPECT, MAP_HEIGHT, MAP_WIDTH, project } from "./map";
import type { Region } from "./places";

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

export default function WorldMap({ regions }: { regions: Region[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = regions.find((r) => r.id === openId) ?? null;

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
        {regions.map((region) => {
          const { xPct, yPct } = project(region.lat, region.lng);
          return (
            <button
              key={region.id}
              type="button"
              className="pin"
              data-testid="pin"
              data-region={region.id}
              aria-label={region.id}
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
              onClick={() => setOpenId(region.id)}
            >
              <PinIcon />
            </button>
          );
        })}
      </div>

      {open && (
        <div className="overlay" data-testid="overlay" data-region={open.id}>
          <div className="backdrop" data-testid="backdrop" onClick={() => setOpenId(null)} />
          <div className="sheet" data-testid="sheet">
            {open.places.map((place) => (
              <a key={place.name} className="card" data-testid="card" href={place.url}>
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
