// No "use client" — pure CSS/JSX, safe for server and client components.
export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}
    >
      {/* Orb 1 — Indigo/Violet, top-left */}
      <div
        className="aurora-orb-1"
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "55vw",
          height: "55vw",
          maxWidth: "700px",
          maxHeight: "700px",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.2) 45%, transparent 72%)",
          filter: "blur(48px)",
          animation: "aurora-drift-1 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Orb 2 — Purple/Violet, bottom-right */}
      <div
        className="aurora-orb-2"
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          maxWidth: "750px",
          maxHeight: "750px",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.3) 0%, rgba(167,139,250,0.18) 40%, transparent 70%)",
          filter: "blur(56px)",
          animation: "aurora-drift-2 28s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Orb 3 — Teal/Cyan, center-right */}
      <div
        className="aurora-orb-3"
        style={{
          position: "absolute",
          top: "20%",
          right: "5%",
          width: "45vw",
          height: "45vw",
          maxWidth: "580px",
          maxHeight: "580px",
          background: "radial-gradient(ellipse at center, rgba(20,184,166,0.25) 0%, rgba(6,182,212,0.15) 45%, transparent 72%)",
          filter: "blur(44px)",
          animation: "aurora-drift-3 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Orb 4 — Deep Blue, center-left */}
      <div
        className="aurora-orb-4"
        style={{
          position: "absolute",
          top: "45%",
          left: "10%",
          width: "35vw",
          height: "35vw",
          maxWidth: "440px",
          maxHeight: "440px",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.22) 0%, rgba(99,102,241,0.12) 50%, transparent 75%)",
          filter: "blur(40px)",
          animation: "aurora-drift-4 15s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </div>
  );
}
