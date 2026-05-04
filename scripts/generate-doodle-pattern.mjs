/**
 * One-off generator: dense scattered doodles with minimum spacing (torus-aware for CSS repeat).
 * Run: node scripts/generate-doodle-pattern.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "src", "components", "chat-doodle-pattern.svg");

const TILE = 1280;
const GAP = 16; // minimum gap between icon bounding circles
const EDGE = 28; // inset from tile edges (prevents seam clipping)
const TARGET = 118;
const MAX_TRIES = 400000;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function torusDist(x1, y1, x2, y2, W, H) {
  let dx = Math.abs(x1 - x2);
  dx = Math.min(dx, W - dx);
  let dy = Math.abs(y1 - y2);
  dy = Math.min(dy, H - dy);
  return Math.hypot(dx, dy);
}

function radiusForScale(s) {
  return 10.2 * s + 9;
}

const inner = [
  `<path d="M4 12 6 5 8 12M10 12l2-7 2 7M3 12q5 6 10 0"/>`,
  `<path d="M2 10Q8 4 14 10Q8 16 2 10M6 8l2-2 2 2"/>`,
  `<circle cx="5" cy="6" r="1.6"/><circle cx="13" cy="6" r="1.6"/><path d="M3 12q5 4 9 0"/>`,
  `<path d="M2 14h4l1-4 3-1 2 5h4M6 10v-3q0-3 3-3h2"/>`,
  `<path d="M10 3v16M6 8H4M6 12H3M14 6h2M14 10h2"/>`,
  `<circle cx="9" cy="9" r="2"/><path d="M9 3v2M9 13v2M3 9h2M13 9h2M4.5 4.5l1.4 1.4M12.1 12.1l1.4 1.4M4.5 13.5l1.4-1.4M12.1 5.9l1.4-1.4"/>`,
  `<path d="M4 6h10l-5 9-5-9zM9 15v4"/>`,
  `<path d="M9 3l-5 7q0 5 5 6t5-6-5-7zM6 6h.2M8 8h.2M10 6h.2M7 9h.2M11 8h.2"/>`,
  `<path d="M2 14L16 4l2 10H2zM5 10h.2M8 7h.2M11 11h.2"/>`,
  `<path d="M2 10L16 3 9 10l-1 6-3-4z"/>`,
  `<rect x="2" y="5" width="16" height="12" rx="2"/><rect x="6" y="3" width="5" height="3" rx="1"/><circle cx="10" cy="11" r="3.5"/>`,
  `<path d="M2 12h16M3 12V7l3 3 2-4 2 4 2-4 2 4 3-3v5"/>`,
  `<path d="M10 4v12M4 10h12M5.2 5.2l9.6 9.6M14.8 5.2l-9.6 9.6"/>`,
  `<rect x="2" y="5" width="16" height="12" rx="1"/><path d="M2 7l8 6 8-6"/>`,
  `<path d="M10 4c-4 0-7 3-7 7 0 4 4 7 7 10 3-3 7-6 7-10 0-4-3-7-7-7zM10 21v5"/>`,
  `<path d="M3 16L14 5l3 3L6 19H3v-3zM12 6l2 2"/>`,
  `<path d="M4 12h10a4 4 0 0 0 0-6 3 3 0 0 0-5.5-1.5A4 4 0 0 0 4 12z"/>`,
  `<circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4 4l1.5 1.5M14.5 14.5 16 16M4 16l1.5-1.5M14.5 5.5 16 4"/>`,
  `<path d="M12 3a7 7 0 1 0 7 11 6 6 0 0 1-7-11z"/>`,
  `<path d="M10 17s-6-3.5-6-8a3.5 3.5 0 0 1 6-1 3.5 3.5 0 0 1 6 1c0 4.5-6 8-6 8z"/>`,
  `<path d="M10 2l4 8-4 10-4-10 4-8zM6 10H4M14 10h2M8 18l-2 4M12 18l2 4"/>`,
  `<path d="M2 10 Q10 5 18 10 Q10 15 2 10"/><path d="M14 10l4-2v4z"/><circle cx="5" cy="9" r="1"/>`,
  `<path d="M10 5v11"/><path d="M10 9C6 7 2 10 2 13s4 5 8 3"/><path d="M10 9c4-2 8 1 8 4s-4 5-8 3"/>`,
  `<path d="M10 3v11M6 7q4-2 8 0"/><ellipse cx="10" cy="17" rx="3" ry="2.5"/>`,
  `<path d="M3 4h7v14H4a1 1 0 0 1-1-1V4zM10 4h7v13a1 1 0 0 1-1 1h-6"/><path d="M10 4v14"/>`,
  `<path d="M4 6h10v8H4zM14 8h2a2 2 0 0 1 0 4h-2M6 4V3M10 4V2M8 1v1"/>`,
  `<path d="M10 18V11M5 16L10 5l5 11"/>`,
  `<path d="M10 3c-5 4-7 9 0 15 7-6 5-11 0-15z"/>`,
  `<path d="M10 12v6M4 12q6-7 12 0"/><ellipse cx="10" cy="11" rx="7" ry="4"/>`,
  `<path d="M3 14Q10 6 17 14M5 14Q10 9 15 14M7 14Q10 11 13 14"/>`,
  `<path d="M11 2L7 10h4l-4 8h5l-3 8"/>`,
  `<path d="M10 4c-4 3-6 6-6 9a6 4 0 0 0 12 0c0-3-2-6-6-9z"/>`,
  `<path d="M10 2v16M3 10h14M4.5 4.5l11 11M15.5 4.5l-11 11"/>`,
  `<path d="M1 17h18M4 17L10 7l4 5 4-5 6 10"/>`,
  `<path d="M3 10h14v8H3zM3 10l7-6 7 6M8 14v4h4v-4"/>`,
  `<path d="M3 12h14l-2 3H5z"/><circle cx="6" cy="15" r="1.5"/><circle cx="14" cy="15" r="1.5"/>`,
  `<circle cx="5" cy="14" r="3"/><circle cx="15" cy="14" r="3"/><path d="M5 14l5-6 2 3 3-3M15 14l-5-6"/>`,
  `<path d="M2 9h16v7H2zM5 11h3v2M12 11h3v2"/><path d="M3 16h3M14 16h3"/>`,
  `<path d="M2 10h14M9 6l-1 8 1-1 1 1 1-8z"/>`,
  `<path d="M2 14h16l-2 3H4zM10 14V7"/><path d="M7 9l6-1"/>`,
  `<path d="M10 4v9M6 13h8"/><path d="M10 13c-3 0-5 2-5 4h10c0-2-2-4-5-4"/><circle cx="10" cy="10" r="1"/>`,
  `<circle cx="10" cy="10" r="7"/><path d="M10 10l2-5M10 10l-2 5"/><circle cx="10" cy="10" r="0.8"/>`,
  `<circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 4q3 3 3 6t-3 6"/>`,
  `<circle cx="10" cy="10" r="8"/><path d="M10 10V5M10 10l4 2"/>`,
  `<circle cx="7" cy="8" r="2.5"/><path d="M9 10l6 6M14 14l1 1"/>`,
  `<path d="M6 9V7a4 3 0 0 1 8 0v2"/><rect x="5" y="9" width="10" height="9" rx="1"/>`,
  `<circle cx="8" cy="8" r="4.5"/><path d="M11 11l5 5"/>`,
  `<ellipse cx="10" cy="13" rx="3" ry="2"/><path d="M13 4v9M13 4h-2a2 2 0 0 0 0 4"/>`,
  `<path d="M3 11a7 5 0 0 1 14 0"/><path d="M3 11v3a2 2 0 0 0 4 0v-3M13 11v3a2 2 0 0 0 4 0v-3"/>`,
  `<path d="M15 3L8 16"/><path d="M7 17l2 1"/><path d="M14 4l-2 5"/>`,
  `<path d="M4 12q6-8 12 0t-4 5q-3 2-8 0"/><circle cx="7" cy="11" r="0.6"/><circle cx="12" cy="10" r="0.6"/><circle cx="10" cy="13" r="0.6"/>`,
  `<path d="M7 3l6 14M13 3L7 17"/><circle cx="8" cy="8" r="1.2"/><circle cx="12" cy="8" r="1.2"/>`,
  `<path d="M5 5h10v2H5z"/><path d="M10 7v11"/>`,
  `<path d="M4 4l12 12"/><path d="M13 4h3v3a4 4 0 0 1-5 5l-4-4"/>`,
  `<path d="M3 5h14v9H3z"/><path d="M2 15h16v2H2z"/>`,
  `<rect x="6" y="2" width="8" height="16" rx="1"/><path d="M10 4h.1"/>`,
];

const labels = [
  "cat",
  "bird",
  "frog",
  "dinosaur",
  "cactus",
  "flower",
  "ice cream",
  "strawberry",
  "cheese",
  "paper airplane",
  "camera",
  "crown",
  "star",
  "envelope",
  "balloon",
  "pencil",
  "cloud",
  "sun",
  "moon",
  "heart",
  "rocket",
  "fish",
  "butterfly",
  "guitar",
  "book",
  "coffee",
  "tree",
  "leaf",
  "mushroom",
  "rainbow",
  "lightning bolt",
  "raindrop",
  "snowflake",
  "mountain",
  "house",
  "car",
  "bicycle",
  "train",
  "airplane",
  "ship",
  "anchor",
  "compass",
  "globe",
  "clock",
  "key",
  "lock",
  "magnifying glass",
  "music note",
  "headphones",
  "paintbrush",
  "palette",
  "scissors",
  "hammer",
  "wrench",
  "laptop",
  "smartphone",
];

function shuffleOrder(rand, n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const rand = mulberry32(0x9e3779b9);
const placed = [];

const N = inner.length;
let iconCycle = [];
while (iconCycle.length < TARGET + N) {
  iconCycle.push(...shuffleOrder(rand, N));
}

let idx = 0;
let tries = 0;
while (placed.length < TARGET && tries < MAX_TRIES) {
  tries++;
  const s = 1.85 + rand() * (4.85 - 1.85);
  const r = radiusForScale(s);
  if (r * 2 > TILE - 2 * EDGE) continue;

  const cx = EDGE + r + rand() * (TILE - 2 * EDGE - 2 * r);
  const cy = EDGE + r + rand() * (TILE - 2 * EDGE - 2 * r);
  const rot = -48 + rand() * 96;

  let ok = true;
  for (const p of placed) {
    const d = torusDist(cx, cy, p.cx, p.cy, TILE, TILE);
    if (d < r + p.r + GAP) {
      ok = false;
      break;
    }
  }
  if (!ok) continue;

  const id = iconCycle[idx % iconCycle.length];
  idx++;
  placed.push({ cx, cy, r, s, rot, id });
}

placed.sort((a, b) => a.cy - b.cy || a.cx - b.cx);

const parts = placed.map(
  (p) =>
    `    <!-- ${labels[p.id]} -->\n    <g transform="translate(${p.cx.toFixed(1)} ${p.cy.toFixed(1)}) rotate(${p.rot.toFixed(1)}) scale(${p.s.toFixed(3)}) translate(-10 -10)">\n      ${inner[p.id]}\n    </g>`
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">
  <g fill="none" stroke="#14532d" stroke-opacity="0.09" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">
${parts.join("\n")}
  </g>
</svg>
`;

fs.writeFileSync(OUT, svg, "utf8");
console.log(`Wrote ${placed.length} icons (${TARGET} target) to ${OUT} after ${tries} tries.`);
