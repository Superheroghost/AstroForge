import { memo, useEffect, useRef } from "react";
import type { GameEngine } from "@/core/engine/game-engine";
import { formatSuffix } from "@/core/math/big-number";
import { computeRates, dysonProgress, generatorLevel, pulsePower } from "@/domain/simulation";

const C = {
  void: "#07090d",
  starCore: "#f4f7fb",
  starMid: "#c5dbe2",
  ice: "#8ec8d4",
  steel: "#e6edf5",
  muted: "#8b97a8",
};

interface Ripple {
  life: number;
  max: number;
}

interface Floater {
  x: number;
  y: number;
  vy: number;
  life: number;
  text: string;
}

interface Particle {
  a: number;
  r: number;
  speed: number;
  size: number;
}

interface Props {
  engine: GameEngine;
  onPulse: () => void;
}

export const OrbitalCanvas = memo(function OrbitalCanvas({ engine, onPulse }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const onPulseRef = useRef(onPulse);
  onPulseRef.current = onPulse;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    engine.setReducedMotion(reduced);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let pulseBoost = 0;

    const stars = new Float32Array(240);
    for (let i = 0; i < stars.length; i += 3) {
      stars[i] = Math.random();
      stars[i + 1] = Math.random();
      stars[i + 2] = 0.15 + Math.random() * 0.7;
    }

    const particles: Particle[] = Array.from({ length: 48 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.25 + Math.random() * 0.85,
      speed: 0.08 + Math.random() * 0.18,
      size: 0.6 + Math.random() * 1.4,
    }));

    const ripples: Ripple[] = [];
    const floaters: Floater[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const project = (x: number, y: number, z: number, rot: number) => {
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      const xr = x * cr + z * sr;
      const zr = -x * sr + z * cr;
      const persp = 1.35 / (1.35 + zr);
      return { x: xr * persp, y: y * persp, z: zr, p: persp };
    };

    const hitStar = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.42;
      const dx = x - cx;
      const dy = y - cy;
      return dx * dx + dy * dy <= (R * 0.22) ** 2 * 2.2;
    };

    const firePulse = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      pulseBoost = 1;
      ripples.push({ life: 0, max: 0.7 });
      const state = engine.getState();
      const amt = pulsePower(state);
      floaters.push({
        x,
        y,
        vy: -28,
        life: 0,
        text: `+${formatSuffix(amt)}`,
      });
      if (floaters.length > 14) floaters.shift();
      onPulseRef.current();
    };

    const onPointer = (ev: PointerEvent) => {
      if (hitStar(ev.clientX, ev.clientY)) {
        ev.preventDefault();
        firePulse(ev.clientX, ev.clientY);
      }
    };
    canvas.addEventListener("pointerdown", onPointer);

    const draw = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      const motion = reduced ? 0 : 1;
      time += dt * motion;
      pulseBoost = Math.max(0, pulseBoost - dt * 2.8);

      const state = engine.getState();
      const drones = generatorLevel(state, "drone");
      const harvesters = generatorLevel(state, "harvester");
      const lasers = generatorLevel(state, "laser");
      const siphons = generatorLevel(state, "siphon");
      const swarm = generatorLevel(state, "swarm");
      const forge = generatorLevel(state, "forge");
      const quantum = generatorLevel(state, "quantum");
      const progress = dysonProgress(state);
      const rates = computeRates(state);
      const intensity = Math.min(1, 0.15 + rates.energy.log10() / 12);

      if (hintRef.current) {
        hintRef.current.style.opacity = drones === 0 && state.stats.totalClicks < 8 ? "1" : "0";
      }

      const cx = w * 0.5;
      const cy = h * 0.52;
      const R = Math.min(w, h) * 0.42;

      ctx.fillStyle = C.void;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < stars.length; i += 3) {
        const sx = stars[i] * w;
        const sy = stars[i + 1] * h;
        const a = stars[i + 2] * (0.35 + 0.2 * Math.sin(time * 0.6 + i));
        ctx.fillStyle = `rgba(230,237,245,${a})`;
        ctx.fillRect(sx, sy, 1.1, 1.1);
      }

      ctx.beginPath();
      const vig = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
      vig.addColorStop(0, "rgba(7,9,13,0)");
      vig.addColorStop(1, "rgba(7,9,13,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      const rot = time * 0.12;
      const rings = 3 + Math.min(3, Math.floor(progress * 4));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.18);
      for (let i = 1; i <= rings; i++) {
        const rr = R * (0.32 + i * 0.16);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(142,200,212,${0.08 + i * 0.03 + progress * 0.08})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.ellipse(0, 0, rr, rr * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // Dyson wireframe (lat/lon sphere).
      ctx.save();
      ctx.translate(cx, cy);
      const latStep = 22;
      const lonStep = 18;
      const sphereR = R * (0.55 + progress * 0.08);
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += latStep) {
        const latR = ((lat + 90) / 180) * Math.PI;
        ctx.beginPath();
        let first = true;
        for (let lon = 0; lon <= 360; lon += lonStep) {
          const lonR = (lon * Math.PI) / 180;
          const x = Math.sin(lonR) * Math.sin(latR);
          const y = Math.cos(latR);
          const z = Math.cos(lonR) * Math.sin(latR);
          const p = project(x, y, z, rot);
          const px = p.x * sphereR;
          const py = p.y * sphereR * 0.92;
          if (p.z > -0.15) {
            if (first) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
            first = false;
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = `rgba(142,200,212,${0.08 + progress * 0.28})`;
        ctx.stroke();
      }
      for (let lon = 0; lon < 360; lon += lonStep) {
        const lonR = (lon * Math.PI) / 180;
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 10) {
          const latR = ((lat + 90) / 180) * Math.PI;
          const x = Math.sin(lonR) * Math.sin(latR);
          const y = Math.cos(latR);
          const z = Math.cos(lonR) * Math.sin(latR);
          const p = project(x, y, z, rot);
          const px = p.x * sphereR;
          const py = p.y * sphereR * 0.92;
          if (p.z > -0.1) {
            if (first) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
            first = false;
          } else first = true;
        }
        ctx.strokeStyle = `rgba(230,237,245,${0.05 + progress * 0.22})`;
        ctx.stroke();
      }

      // Swarm nodes
      const nodeCount = Math.min(72, swarm + Math.floor(forge * 0.4) + Math.floor(quantum * 0.2));
      for (let i = 0; i < nodeCount; i++) {
        const lon = (i / Math.max(1, nodeCount)) * Math.PI * 2 + rot * 0.4;
        const lat = Math.asin(((i % 7) - 3) / 4.2);
        const x = Math.cos(lat) * Math.cos(lon);
        const y = Math.sin(lat);
        const z = Math.cos(lat) * Math.sin(lon);
        const p = project(x, y, z, rot * 0.7);
        if (p.z < -0.2) continue;
        const px = p.x * sphereR;
        const py = p.y * sphereR * 0.92;
        ctx.fillStyle = `rgba(142,200,212,${0.35 + p.p * 0.5})`;
        ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
      }
      ctx.restore();

      // Inward energy motes
      const moteN = Math.floor(8 + intensity * 40);
      for (let i = 0; i < moteN && i < particles.length; i++) {
        const p = particles[i];
        if (motion) p.r -= p.speed * dt;
        if (p.r < 0.08) {
          p.r = 0.95 + Math.random() * 0.2;
          p.a = Math.random() * Math.PI * 2;
        }
        const px = cx + Math.cos(p.a + time * 0.15) * R * p.r;
        const py = cy + Math.sin(p.a + time * 0.15) * R * p.r * 0.62;
        ctx.fillStyle = `rgba(142,200,212,${0.15 + (1 - p.r) * 0.55})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Drones on equatorial orbits
      const visDrones = Math.min(28, drones + Math.min(8, harvesters));
      for (let i = 0; i < visDrones; i++) {
        const orbit = 0.58 + (i % 3) * 0.12;
        const speed = (0.35 + (i % 5) * 0.07) * (i % 2 === 0 ? 1 : -1);
        const a = time * speed + (i / visDrones) * Math.PI * 2;
        const px = cx + Math.cos(a) * R * orbit;
        const py = cy + Math.sin(a) * R * orbit * 0.36;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = C.steel;
        ctx.fillRect(-3.5, -1.2, 7, 2.4);
        ctx.fillStyle = C.ice;
        ctx.fillRect(2.2, -0.7, 2.4, 1.4);
        ctx.restore();
      }

      // Occasional laser
      if (lasers > 0 && !reduced) {
        const phase = (time * 0.7) % 3;
        if (phase < 0.18) {
          ctx.strokeStyle = `rgba(142,200,212,${0.35 * (1 - phase / 0.18)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx + R * 0.7, cy - R * 0.18);
          ctx.lineTo(cx + R * 0.12, cy + R * 0.04);
          ctx.stroke();
        }
      }

      // Fusion siphon spokes
      if (siphons > 0) {
        const n = Math.min(6, 2 + Math.floor(siphons / 8));
        for (let i = 0; i < n; i++) {
          const a = time * 0.25 + (i / n) * Math.PI * 2;
          ctx.strokeStyle = "rgba(142,200,212,0.12)";
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * R * 0.16, cy + Math.sin(a) * R * 0.16);
          ctx.lineTo(cx + Math.cos(a) * R * 0.48, cy + Math.sin(a) * R * 0.3);
          ctx.stroke();
        }
      }

      // Star
      const bloom = 1 + pulseBoost * 0.18 + (reduced ? 0 : 0.025 * Math.sin(time * 1.6));
      const starR = R * 0.13 * bloom;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR * 4.2);
      glow.addColorStop(0, "rgba(244,247,251,0.85)");
      glow.addColorStop(0.18, "rgba(142,200,212,0.45)");
      glow.addColorStop(0.5, "rgba(142,200,212,0.08)");
      glow.addColorStop(1, "rgba(142,200,212,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, starR * 4.2, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR);
      core.addColorStop(0, C.starCore);
      core.addColorStop(0.55, C.starMid);
      core.addColorStop(1, C.ice);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, starR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(244,247,251,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, starR * 1.08, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.life += dt;
        const t = r.life / r.max;
        if (t >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(142,200,212,${(1 - t) * 0.55})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, starR * (1.2 + t * 3.2), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "center";
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.life += dt;
        f.y += f.vy * dt;
        f.vy *= 0.96;
        if (f.life > 0.9) {
          floaters.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(230,237,245,${1 - f.life / 0.9})`;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.textAlign = "start";

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, [engine]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-bg">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        aria-label="Orbital visualizer. Tap the star to mine ore."
      />
      <p
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-muted transition-opacity duration-500"
      >
        Tap the star to extract ore
      </p>
    </div>
  );
});
