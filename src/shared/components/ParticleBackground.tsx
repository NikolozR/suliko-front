"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Particle {
  baseX: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  // Fourier components for horizontal oscillation
  f1: { amp: number; freq: number; phase: number };
  f2: { amp: number; freq: number; phase: number };
  f3: { amp: number; freq: number; phase: number };
}

const PARTICLE_COUNT = 55;

function createParticle(width: number, height: number, scattered = false): Particle {
  const baseX = Math.random() * width;
  return {
    baseX,
    x: baseX,
    y: scattered ? Math.random() * height : -Math.random() * height * 0.3,
    speed: 0.25 + Math.random() * 0.55,
    size: 0.8 + Math.random() * 1.6,
    opacity: 0.08 + Math.random() * 0.32,
    f1: { amp: 18 + Math.random() * 35, freq: 0.0018 + Math.random() * 0.003, phase: Math.random() * Math.PI * 2 },
    f2: { amp: 8 + Math.random() * 18,  freq: 0.005  + Math.random() * 0.007, phase: Math.random() * Math.PI * 2 },
    f3: { amp: 3 + Math.random() * 8,   freq: 0.012  + Math.random() * 0.015, phase: Math.random() * Math.PI * 2 },
  };
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    canvas.width = W();
    canvas.height = H();

    const onResize = () => {
      canvas.width = W();
      canvas.height = H();
    };
    window.addEventListener("resize", onResize);

    // Initialise particles scattered across screen so it doesn't look empty on load
    const particles: Particle[] = Array.from(
      { length: PARTICLE_COUNT },
      () => createParticle(W(), H(), true)
    );

    let t = 0;
    let animId: number;

    const isDark = resolvedTheme === "dark";
    // light: soft blue  |  dark: soft white
    const [r, g, b] = isDark ? [200, 220, 255] : [37, 99, 235];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;

      for (const p of particles) {
        // Fourier horizontal drift: sum of 3 sine waves
        const dx =
          p.f1.amp * Math.sin(p.f1.freq * t + p.f1.phase) +
          p.f2.amp * Math.sin(p.f2.freq * t + p.f2.phase) +
          p.f3.amp * Math.sin(p.f3.freq * t + p.f3.phase);

        p.x = p.baseX + dx;
        p.y += p.speed;

        // Respawn at top when particle exits bottom
        if (p.y > canvas.height + 10) {
          const fresh = createParticle(canvas.width, canvas.height, false);
          Object.assign(p, fresh);
        }

        // Fade in near top, fade out near bottom
        let alpha = p.opacity;
        if (p.y < 60) alpha *= p.y / 60;
        if (p.y > canvas.height - 60) alpha *= (canvas.height - p.y) / 60;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, alpha)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
