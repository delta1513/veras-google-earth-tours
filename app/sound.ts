// Soft synthesized sounds (Web Audio). No files. Every call is safe to ignore:
// if audio is unavailable or blocked, nothing happens.
type Ctx = AudioContext;
let ctx: Ctx | null = null;

// Call from inside a tap handler (iOS Safari only starts audio from a gesture).
function audio(): Ctx | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function blip(c: Ctx, type: OscillatorType, f0: number, f1: number, peak: number, dur: number, at = 0) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.5);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

// A round, friendly "bloop" when a pin opens.
export function playPop() {
  try {
    const c = audio();
    if (!c) return;
    blip(c, "sine", 330, 620, 0.16, 0.2);
    blip(c, "triangle", 660, 1240, 0.03, 0.14);
  } catch {
    /* ignore */
  }
}

// An airy whoosh: filtered noise sweeping up and away.
export function playWhoosh() {
  try {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const dur = 0.62;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(350, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
    bp.frequency.exponentialRampToValueAtTime(1200, t + dur);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(lp).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
    blip(c, "sine", 520, 980, 0.04, 0.3);
  } catch {
    /* ignore */
  }
}

// A very soft tick when the sheet closes.
export function playTick() {
  try {
    const c = audio();
    if (!c) return;
    blip(c, "triangle", 720, 480, 0.06, 0.09);
  } catch {
    /* ignore */
  }
}
