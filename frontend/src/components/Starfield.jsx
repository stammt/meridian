export const STARS = [...Array(60)].map(() => ({
  w: Math.random() > 0.9 ? "3px" : "1px",
  h: Math.random() > 0.9 ? "3px" : "1px",
  opacity: 0.15 + Math.random() * 0.5,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
}));

export function Starfield() {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      {/* Nav grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(26,173,173,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,173,173,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.6) 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.6) 0%, transparent 75%)",
        }}
      />
      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: s.w,
            height: s.h,
            background: `rgba(255,255,255,${s.opacity})`,
            left: s.left,
            top: s.top,
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}
