// Genera public/og.png (1200x630) para Open Graph.
// Uso: node scripts/og-image.mjs
import { createRequire } from "node:module";

// sharp llega como dependencia transitiva de Astro (no hoisteada por pnpm)
const require = createRequire(import.meta.url);
const sharp = require("../node_modules/.pnpm/sharp@0.35.4_@types+node@24.13.3/node_modules/sharp");

const W = 1200;
const H = 630;
const STEP = 44;

let grid = "";
for (let x = STEP; x < W; x += STEP) {
  grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#F3F5F9" stroke-opacity="0.05"/>`;
}
for (let y = STEP; y < H; y += STEP) {
  grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#F3F5F9" stroke-opacity="0.05"/>`;
}

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0C101B"/>
  ${grid}
  <rect x="80" y="238" width="56" height="5" fill="#3D66CB"/>
  <text x="80" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="76" font-weight="600" fill="#F3F5F9">Jorge Espinoza</text>
  <text x="80" y="392" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#9FABC2">Consultor Oracle NetSuite · Full Stack · DevOps</text>
  <text x="80" y="540" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#5E6C88">porfolio.dev — Investigación publicada en Springer Nature (IBIMA 2024)</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log("og.png generado");
