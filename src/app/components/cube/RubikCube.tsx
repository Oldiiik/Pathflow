// Pathflow's mark: a STATIC isometric 3x3 cube, drawn as an SVG.
// Three visible faces (top / left / right), each a 3x3 grid of glossy navy
// cubies with gaps, on a dark body. No animation.

type P = [number, number];

// Cube silhouette vertices in a 0..200 viewBox (classic isometric hexagon).
const A: P = [100, 16];   // top
const Bv: P = [184, 62];  // right-top
const Cv: P = [100, 108]; // center (front vertical edge top)
const D: P = [16, 62];    // left-top
const E: P = [184, 150];  // right-bottom
const F: P = [100, 196];  // bottom
const G: P = [16, 150];   // left-bottom

const add = (p: P, q: P): P => [p[0] + q[0], p[1] + q[1]];
const sub = (p: P, q: P): P => [p[0] - q[0], p[1] - q[1]];
const mul = (p: P, k: number): P => [p[0] * k, p[1] * k];

// face base colors [r,g,b]; top brightest, right darkest.
const FACES: { origin: P; ea: P; eb: P; base: [number, number, number] }[] = [
  { origin: A, ea: sub(Bv, A), eb: sub(D, A), base: [44, 96, 206] },   // top
  { origin: D, ea: sub(G, D), eb: sub(Cv, D), base: [22, 56, 132] },   // left
  { origin: Bv, ea: sub(E, Bv), eb: sub(Cv, Bv), base: [13, 38, 92] }, // right
];

function clampHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

// shrink a quad toward its centroid to create the gap between cubies.
function inset(pts: P[], k: number): P[] {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k] as P);
}

function buildCells() {
  const cells: { points: string; fill: string }[] = [];
  for (const face of FACES) {
    const va = mul(face.ea, 1 / 3);
    const vb = mul(face.eb, 1 / 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const p00 = add(add(face.origin, mul(va, i)), mul(vb, j));
        const quad = inset([p00, add(p00, va), add(p00, add(va, vb)), add(p00, vb)], 0.86);
        // brighten toward the far corner for a glossy sheen
        const t = (i + j) / 4;
        const fill = clampHex([
          face.base[0] + t * 46 + 6,
          face.base[1] + t * 52 + 6,
          face.base[2] + t * 40 + 10,
        ]);
        cells.push({ points: quad.map((p) => p.join(",")).join(" "), fill });
      }
    }
  }
  return cells;
}

const CELLS = buildCells();

export function RubikCube({ size = 120, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      {glow && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: size * 1.7, height: size * 1.7, background: "radial-gradient(circle, rgba(43,90,212,0.3), transparent 62%)" }}
        />
      )}
      <svg viewBox="0 0 200 212" width={size} height={size} className="relative block">
        <defs>
          <linearGradient id="pf-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(150,185,255,0.5)" />
            <stop offset="55%" stopColor="rgba(150,185,255,0)" />
          </linearGradient>
        </defs>
        {/* dark cube body so gaps read as the frame */}
        <polygon points={`${A.join(",")} ${Bv.join(",")} ${E.join(",")} ${F.join(",")} ${G.join(",")} ${D.join(",")}`} fill="#05070d" />
        {CELLS.map((c, i) => (
          <polygon key={i} points={c.points} fill={c.fill} />
        ))}
        {/* sheen on the top face */}
        <polygon points={`${A.join(",")} ${Bv.join(",")} ${Cv.join(",")} ${D.join(",")}`} fill="url(#pf-sheen)" opacity={0.35} />
      </svg>
    </div>
  );
}

export function MiniCube({ size = 24 }: { size?: number }) {
  return <RubikCube size={size} glow={false} />;
}
