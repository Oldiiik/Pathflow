import { useRef, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";

// A card that tilts in 3D toward the cursor — the app's "cubic surface".
// Uses motion values (not state) so continuous hover stays at 60fps.
export function TiltCard({
  children,
  className = "",
  style,
  max = 8,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  max?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  // Glare follows the cursor.
  const glareX = useTransform(mx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(my, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(220px circle at ${glareX} ${glareY}, rgba(120,160,255,0.16), transparent 60%)`;

  const handle = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <div style={{ perspective: 1100 }}>
      <motion.div
        ref={ref}
        onPointerMove={handle}
        onPointerLeave={reset}
        onClick={onClick}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", ...style }}
        className={`relative ${className}`}
      >
        {children}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
          style={{ background: glare }}
          whileHover={{ opacity: 1 }}
        />
      </motion.div>
    </div>
  );
}
