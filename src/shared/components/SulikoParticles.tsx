"use client";

import { useCallback, useEffect, useState } from "react";
import type { Engine } from "tsparticles-engine";
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";
import { useTheme } from "next-themes";

interface SulikoParticlesProps {
  className?: string;
  fullScreen?: boolean;
  particleCount?: number;
  speed?: number;
  enableInteractions?: boolean;
}

const SulikoParticles: React.FC<SulikoParticlesProps> = ({
  className = "lg:block hidden",
  fullScreen = false,
  particleCount = 80,
  speed = 1,
  enableInteractions = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(
    async () => {
    },
    []
  );

  const isDark = mounted && resolvedTheme === "dark";
  const particleColor = isDark ? "#3b59f3" : "#11289c";
  const linkColor = isDark ? "#6c7ae0" : "#4e5da5";

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: enableInteractions ? "auto" : "none",
      }}
      options={{
        fullScreen: { enable: fullScreen },
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: enableInteractions,
              mode: "push",
            },
            onHover: {
              enable: enableInteractions,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: particleColor,
          },
          links: {
            color: linkColor,
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: speed,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 900,
            },
            value: particleCount,
          },
          opacity: {
            value: 0.5,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default SulikoParticles;
