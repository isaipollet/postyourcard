/**
 * Generate QR codes for all hotels and save as individual PNGs.
 *
 * Usage:
 *   npx tsx scripts/bulk-qr.ts [output-dir]
 *
 * Defaults to ./qr-codes/
 * Requires env vars: DATABASE_URL
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import QRCode from "qrcode";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
});

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://postyourcard.com";

async function main() {
  const outputDir = process.argv[2] || "./qr-codes";
  mkdirSync(outputDir, { recursive: true });

  const allHotels = await db
    .select({ name: hotels.name, slug: hotels.slug })
    .from(hotels)
    .orderBy(hotels.name);

  console.log(`Generating QR codes for ${allHotels.length} hotels...\n`);

  for (const hotel of allHotels) {
    const url = `${BASE_URL}/order/${hotel.slug}`;
    const filePath = join(outputDir, `${hotel.slug}.png`);

    const buffer = await QRCode.toBuffer(url, {
      width: 512,
      margin: 2,
      color: {
        dark: "#0F6E56",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });

    writeFileSync(filePath, buffer);
    console.log(`  [OK] ${hotel.name} → ${filePath}`);
  }

  console.log(`\nDone. ${allHotels.length} QR codes saved to ${outputDir}/`);
}

main();
