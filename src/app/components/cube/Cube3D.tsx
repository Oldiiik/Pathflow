import { motion } from "motion/react";

// A clean, detail-less 3D cube (CSS 3D). Solid shaded blue faces — no grid,
// no stickers — slowly turning. Used as the landing's hero model.

const FACES: { t: string; c: string }[] = [
  { t: "rotateY(0deg)", c: "#3f6ae6" },     // front
  { t: "rotateY(90deg)", c: "#244fbe" },    // right
  { t: "rotateY(180deg)", c: "#2e58cf" },   // back
  { t: "rotateY(-90deg)", c: "#1e4099" },   // left
  { t: "rotateX(90deg)", c: "#5b86ff" },    // top (lightest)
  { t: "rotateX(-90deg)", c: "#142c66" },   // bottom (deepest)
];

export function Cube3D({ size = 260 }: { size?: number }) {
  const half = size / 2;
  const radius = size * 0.055;

  return (
    <div className="relative" style={{ width: size, height: size, perspective: size * 3.4 }} aria-hidden>
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: size * 1.7, height: size * 1.7, background: "radial-gradient(circle, rgba(79,124,255,0.28), transparent 62%)" }}
      />
      {/* contact shadow */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{ bottom: -size * 0.06, width: size * 0.78, height: size * 0.12, background: "radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 70%)", filter: "blur(6px)" }}
      />
      {/* gentle float */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ y: [0, -size * 0.04, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* slow turntable */}
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", rotateX: -18 }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          {FACES.map((f, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: size,
                height: size,
                transform: `${f.t} translateZ(${half}px)`,
                background:
                  f.t === "rotateX(90deg)"
                    ? `linear-gradient(150deg, #7aa0ff, ${f.c})`
                    : f.c,
                borderRadius: radius,
                backfaceVisibility: "hidden",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
