interface AudioApi {
  unlock: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  pulse: () => void;
  buy: (milestone: boolean) => void;
  research: () => void;
  prestige: () => void;
  hover: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let muted = false;
let padStarted = false;
let lastPulseAt = 0;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    music = ctx.createGain();
    sfx.gain.value = 0.7;
    music.gain.value = 0.18;
    master.gain.value = muted ? 0 : 0.85;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

function ramp(node: GainNode, value: number, time = 0.03): void {
  if (!ctx) return;
  node.gain.setTargetAtTime(value, ctx.currentTime, time);
}

function envTone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain = 0.12,
  bus: GainNode | null = sfx,
  slide?: number,
): void {
  if (!ctx || !bus || muted) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), ctx.currentTime + dur);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function noiseBurst(dur: number, gain = 0.04): void {
  if (!ctx || !sfx || muted) return;
  const n = 2 * ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 900;
  src.buffer = buffer;
  const t = ctx.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfx);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function startPad(): void {
  if (!ctx || !music || padStarted || muted) return;
  padStarted = true;
  const make = (freq: number, type: OscillatorType, detune: number) => {
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    g.gain.value = 0.07;
    osc.connect(g);
    g.connect(music!);
    osc.start();
  };
  make(55, "sine", 0);
  make(82.4, "sine", 6);
  make(110, "triangle", -4);
}

function resume(): void {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  if (!muted) startPad();
}

export const audio: AudioApi = {
  unlock() {
    resume();
  },
  setMuted(value: boolean) {
    muted = value;
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("astroforge.muted", value ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
    const c = ensure();
    if (!c || !master) return;
    ramp(master, value ? 0 : 0.85, 0.05);
    if (!value) {
      resume();
      startPad();
    }
  },
  isMuted() {
    return muted;
  },
  pulse() {
    const now = performance.now();
    if (now - lastPulseAt < 40) return;
    lastPulseAt = now;
    const rate = 1 + (Math.random() * 0.16 - 0.08);
    envTone(620 * rate, 0.07, "sine", 0.08);
    envTone(1240 * rate, 0.05, "triangle", 0.03);
  },
  buy(milestone: boolean) {
    if (milestone) {
      envTone(392, 0.18, "sine", 0.1, sfx, 784);
      envTone(523, 0.22, "triangle", 0.06);
      return;
    }
    envTone(330 + Math.random() * 20, 0.09, "square", 0.045);
    envTone(440, 0.07, "sine", 0.04);
  },
  research() {
    envTone(262, 0.16, "sine", 0.08, sfx, 523);
    envTone(392, 0.2, "triangle", 0.05);
  },
  prestige() {
    noiseBurst(0.35, 0.05);
    envTone(80, 0.8, "sine", 0.16, sfx, 40);
    envTone(220, 0.6, "triangle", 0.08, sfx, 880);
  },
  hover() {
    envTone(880, 0.03, "sine", 0.015);
  },
};

export function hydrateMute(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    muted = localStorage.getItem("astroforge.muted") === "1";
  } catch {
    muted = false;
  }
  return muted;
}

export function haptic(kind: "pulse" | "buy" | "milestone" | "prestige"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    if (kind === "pulse") navigator.vibrate(8);
    else if (kind === "buy") navigator.vibrate(12);
    else if (kind === "milestone") navigator.vibrate([18, 30, 18]);
    else navigator.vibrate([40, 40, 80, 40, 120]);
  } catch {
    /* ignore */
  }
}
