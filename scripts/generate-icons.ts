/**
 * Generates placeholder PWA icons as SVG → PNG.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 *
 * Replace these with real branded icons before launch.
 */

import { writeFileSync } from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const teal = "#0F6E56";
const bg = "#FFFDF9";

for (const size of sizes) {
  const fontSize = Math.round(size * 0.2);
  const iconSize = Math.round(size * 0.35);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="${teal}"/>
  <rect x="${(size - iconSize) / 2}" y="${size * 0.2}" width="${iconSize}" height="${iconSize * 0.7}" rx="${Math.round(size * 0.03)}" fill="${bg}" opacity="0.9"/>
  <text x="${size / 2}" y="${size * 0.78}" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${fontSize}" fill="${bg}">PYC</text>
</svg>`;

  writeFileSync(`public/icons/icon-${size}x${size}.svg`, svg);
  console.log(`Generated icon-${size}x${size}.svg`);
}

console.log("\nNote: Convert SVGs to PNGs before deploying.");
console.log("You can use: npx sharp-cli -i public/icons/icon-512x512.svg -o public/icons/icon-512x512.png");
console.log("Or replace with real branded icons.");
