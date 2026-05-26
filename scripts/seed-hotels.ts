/**
 * Bulk seed hotels from a CSV file.
 *
 * Usage:
 *   npx tsx scripts/seed-hotels.ts hotels.csv
 *
 * CSV format (no header):
 *   Hotel Name,hotel@email.com
 *
 * Requires env vars: DATABASE_URL, STRIPE_SECRET_KEY
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import Stripe from "stripe";
import { readFileSync } from "fs";
import { pgTable, uuid, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";

const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  email: text("email").notNull(),
  logoUrl: text("logo_url"),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  commissionPct: numeric("commission_pct").notNull().default("0.20"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/seed-hotels.ts <path-to-csv>");
    process.exit(1);
  }

  const csv = readFileSync(csvPath, "utf-8");
  const lines = csv
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  console.log(`Found ${lines.length} hotels to seed.\n`);

  let success = 0;
  let failed = 0;

  for (const line of lines) {
    const [name, email] = line.split(",").map((s) => s.trim());
    if (!name || !email) {
      console.error(`Skipping invalid line: ${line}`);
      failed++;
      continue;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BE",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        metadata: { hotel_slug: slug },
      });

      await db.insert(hotels).values({
        name,
        slug,
        email,
        stripeAccountId: account.id,
        stripeOnboardingComplete: false,
      });

      console.log(`  [OK] ${name} (${slug}) — Stripe: ${account.id}`);
      success++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main();
