"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Place } from "./places";

function seal(): string {
  const pts: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    const r = 45 + 3 * Math.cos(t * 16);
    pts.push(`${i ? "L" : "M"}${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return pts.join("") + "Z";
}
const SEAL = seal();

// Glossy green wax seal with a big white arrow.
function GoSeal() {
  return (
    <>
      <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
        <path d={SEAL} fill="url(#seal-g)" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#0a7a30" strokeWidth="2.5" opacity="0.55" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="#7df0a6" strokeWidth="1.5" opacity="0.55" />
        <ellipse cx="38" cy="27" rx="20" ry="10" fill="#ffffff" opacity="0.38" transform="rotate(-28 38 27)" />
      </svg>
      <svg className="arrow" viewBox="0 0 48 48" width="50" height="50" aria-hidden="true">
        <path
          d="M8 24 H34 M23 11 L36 24 L23 37"
          fill="none"
          stroke="#ffffff"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}

// Decorative postage stamp: perforated edge, a little globe with a plane. No letters.
function PostageStamp() {
  const holes: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    holes.push(<circle key={`t${i}`} cx={5 + i * 10} cy={1} r={2.6} />);
    holes.push(<circle key={`b${i}`} cx={5 + i * 10} cy={75} r={2.6} />);
  }
  for (let i = 0; i < 7; i++) {
    holes.push(<circle key={`l${i}`} cx={1} cy={5 + i * 10.5} r={2.6} />);
    holes.push(<circle key={`r${i}`} cx={61} cy={5 + i * 10.5} r={2.6} />);
  }
  return (
    <svg className="pc-stamp" viewBox="0 0 62 76" aria-hidden="true">
      <defs>
        <mask id="stamp-holes">
          <rect width="62" height="76" fill="#fff" />
          <g fill="#000">{holes}</g>
        </mask>
      </defs>
      <g mask="url(#stamp-holes)">
        <rect width="62" height="76" fill="#fffdf4" />
        <rect x="6" y="6" width="50" height="64" fill="#2f86b8" />
        <rect x="6" y="6" width="50" height="64" fill="none" stroke="#f3d27a" strokeWidth="1.5" />
        <circle cx="31" cy="38" r="17" fill="#4fb0d8" />
        <path d="M21 30 C26 26 31 30 28 36 C25 40 20 38 19 34 Z M34 42 C40 38 44 42 42 48 C38 52 33 50 34 42 Z" fill="#6fcf86" />
        <ellipse cx="31" cy="38" rx="17" ry="6" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
        <path d="M31 21 V55" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
        <path d="M10 22 C20 12 36 12 50 20" fill="none" stroke="#f3d27a" strokeWidth="1.4" strokeDasharray="2 2.5" />
        <path d="M46 14 L54 20 L45 22 Z" fill="#fffdf4" />
        <path d="M10 62 H52" stroke="#f3d27a" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

// Wavy cancellation lines with a ring, like a real postmark.
function Postmark() {
  return (
    <svg className="pc-mark" viewBox="0 0 128 56" aria-hidden="true">
      <g fill="none" stroke="#2a3f66" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="30" cy="28" r="23" />
        <circle cx="30" cy="28" r="17" strokeWidth="1.4" />
        <path d="M60 12 q8 -8 16 0 t16 0 t16 0 t16 0" />
        <path d="M60 24 q8 -8 16 0 t16 0 t16 0 t16 0" />
        <path d="M60 36 q8 -8 16 0 t16 0 t16 0 t16 0" />
        <path d="M60 48 q8 -8 16 0 t16 0 t16 0 t16 0" />
      </g>
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
        <radialGradient id="seal-g" cx="40%" cy="32%" r="75%">
          <stop offset="0" stopColor="#5fe58f" />
          <stop offset="0.55" stopColor="#1fb454" />
          <stop offset="1" stopColor="#0b7f31" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Passport stamp: double ring, a globe, and a check. No letters.
function Stamp() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      <circle cx="32" cy="32" r="27" fill="#fffaf0" opacity="0.93" />
      <g filter="url(#ink)" fill="none" stroke="#1d3f94" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="29" strokeWidth="3.4" />
        <circle cx="32" cy="32" r="24" strokeWidth="1.6" />
        <g strokeWidth="1.3" opacity="0.3">
          <ellipse cx="32" cy="32" rx="10" ry="19" />
          <path d="M13 32 H51 M16 22 H48 M16 42 H48" />
        </g>
        <path d="M18 33 L28 43 L47 20" strokeWidth="7" />
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
      <span className="pc-left">
        <span className="thumb-wrap">
          {place.thumbnail ? (
            <Image className="thumb" src={place.thumbnail} alt="" width={178} height={178} unoptimized />
          ) : (
            <span className="thumb placeholder" data-testid="placeholder" />
          )}
        </span>
        {show && (
          <span className={`stamp${thump ? " thump" : ""}`} aria-hidden="true">
            <Stamp />
            {thump && <span className="stamp-splat" />}
          </span>
        )}
      </span>
      <span className="pc-right">
        <Postmark />
        <PostageStamp />
        <span className="card-name">{place.name}</span>
        <span className="card-go">
          <GoSeal />
        </span>
      </span>
    </a>
  );
}

// ---- Paper plane flight ----

const DUR = 540;
const bez = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
const ease = (t: number) => Math.pow(t, 1.35);

export function Flight({ x, y }: { x: number; y: number }) {
  const vw = typeof window === "undefined" ? 1000 : window.innerWidth;
  const P1 = { x: x + 30, y: y + 330 };
  const P2 = { x: vw + 120, y: y - 150 };
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
        const s = 0.65 + 0.35 * Math.min(1, t * 4);
        return {
          offset: t,
          opacity: t < 0.05 ? t / 0.05 : 1,
          transform: `translate(${pt.x - 52}px, ${pt.y - 32}px) rotate(${angle(p)}deg) scale(${s})`,
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
      <svg ref={setPlaneEl as never} className="plane" viewBox="0 0 64 40" width="104" height="65" style={{ opacity: 0 }}>
        <path d="M2 4 L62 20 L22 24 Z" fill="#ffffff" />
        <path d="M22 24 L62 20 L12 37 Z" fill="#cfe3f3" />
        <path d="M22 24 L30 33 L12 37 Z" fill="#9dc2e0" />
        <path d="M2 4 L62 20 L22 24 Z M22 24 L62 20 L12 37 Z" fill="none" stroke="#7fa9cc" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
