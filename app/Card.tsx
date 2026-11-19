"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Place } from "./places";

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

// Rough-edged "ink" filter shared by every stamp.
export function InkDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>
    </svg>
  );
}

// Passport stamp: double ring, a globe, and a check. No letters.
function Stamp() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      <g filter="url(#ink)" fill="none" stroke="#1d3f94" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="29" strokeWidth="3" />
        <circle cx="32" cy="32" r="24" strokeWidth="1.6" />
        <g strokeWidth="1.3" opacity="0.55">
          <ellipse cx="32" cy="32" rx="10" ry="19" />
          <path d="M13 32 H51 M16 22 H48 M16 42 H48" />
        </g>
        <path d="M19 33 L28 42 L46 21" strokeWidth="7" stroke="#fffaf0" />
        <path d="M19 33 L28 42 L46 21" strokeWidth="5" />
        <g fill="#1d3f94" stroke="none">
          <circle cx="32" cy="5.5" r="1.6" />
          <circle cx="32" cy="58.5" r="1.6" />
        </g>
      </g>
    </svg>
  );
}

export function Card({
  place,
  n,
  visited,
  stamped,
  markStamped,
  going,
  onGo,
}: {
  place: Place;
  n: number;
  visited: boolean;
  stamped: Set<string>;
  markStamped: (urls: string[]) => void;
  going: boolean;
  onGo: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void;
}) {
  // The stamp waits until take-off is over, so it lands when Vera comes back.
  const show = visited && !going;
  const [thump, setThump] = useState(false);
  const fresh = show && !stamped.has(place.url);
  if (fresh && !thump) setThump(true); // latch, so the animation is not cut short
  useEffect(() => {
    if (fresh) markStamped([place.url]);
  }, [fresh, place.url, markStamped]);

  return (
    <a
      className={`card${going ? " going" : ""}`}
      data-testid="card"
      data-visited={visited ? "true" : "false"}
      href={place.url}
      style={{ "--n": n } as React.CSSProperties}
      onClick={(e) => onGo(e, place.url)}
    >
      <span className="thumb-wrap">
        {place.thumbnail ? (
          <Image className="thumb" src={place.thumbnail} alt="" width={96} height={96} unoptimized />
        ) : (
          <span className="thumb placeholder" data-testid="placeholder" />
        )}
        {show && (
          <span className={`stamp${thump ? " thump" : ""}`} aria-hidden="true">
            <Stamp />
            {thump && <span className="stamp-splat" />}
          </span>
        )}
      </span>
      <span className="card-name">{place.name}</span>
      <span className="card-go">
        <ArrowIcon />
      </span>
    </a>
  );
}

// ---- Paper plane flight ----

const DUR = 540;
const bez = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
const ease = (t: number) => Math.pow(t, 1.55);

export function Flight({ x, y }: { x: number; y: number }) {
  const vw = typeof window === "undefined" ? 1000 : window.innerWidth;
  const P1 = { x: x + 70, y: y - 250 };
  const P2 = { x: Math.min(x + 460, vw + 80), y: -110 };
  const at = (p: number) => ({ x: bez(x, P1.x, P2.x, p), y: bez(y, P1.y, P2.y, p) });
  const angle = (p: number) => {
    const dx = 2 * (1 - p) * (P1.x - x) + 2 * p * (P2.x - P1.x);
    const dy = 2 * (1 - p) * (P1.y - y) + 2 * p * (P2.y - P1.y);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const puffs = Array.from({ length: 11 }, (_, i) => {
    const t = 0.1 + i * 0.075;
    const pt = at(ease(t));
    return { ...pt, t, big: i % 2 === 0 };
  });

  const [planeEl, setPlaneEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!planeEl || typeof planeEl.animate !== "function") return;
    try {
      const frames = Array.from({ length: 19 }, (_, i) => {
        const t = i / 18;
        const p = ease(t);
        const pt = at(p);
        const s = 0.45 + 0.55 * Math.min(1, t * 4);
        return {
          offset: t,
          opacity: t < 0.05 ? t / 0.05 : 1,
          transform: `translate(${pt.x - 32}px, ${pt.y - 20}px) rotate(${angle(p)}deg) scale(${s})`,
        };
      });
      const a = planeEl.animate(frames, { duration: DUR, easing: "linear", fill: "both" });
      return () => a.cancel();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeEl]);

  return (
    <div className="flight" aria-hidden="true">
      {puffs.map((p, i) => (
        <span
          key={i}
          className={`puff${p.big ? " big" : ""}`}
          style={{ left: p.x, top: p.y, animationDelay: `${Math.round(p.t * DUR)}ms` }}
        />
      ))}
      <svg ref={setPlaneEl as never} className="plane" viewBox="0 0 64 40" width="64" height="40" style={{ opacity: 0 }}>
        <path d="M2 4 L62 20 L22 24 Z" fill="#ffffff" />
        <path d="M22 24 L62 20 L12 37 Z" fill="#cfe3f3" />
        <path d="M22 24 L30 33 L12 37 Z" fill="#9dc2e0" />
        <path d="M2 4 L62 20 L22 24 Z M22 24 L62 20 L12 37 Z" fill="none" stroke="#7fa9cc" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
