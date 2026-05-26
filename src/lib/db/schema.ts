import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  check,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  email: text("email").notNull(),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  city: text("city"),
  website: text("website"),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  welcomeMessage: text("welcome_message"),
  address: text("address"),
  defaultLanguage: text("default_language").default("en"),
  qrPlacement: text("qr_placement"),
  tags: text("tags"),
  active: boolean("active").notNull().default(true),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  commissionPct: numeric("commission_pct").notNull().default("0.20"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id),
    format: text("format").notNull(),
    priceCents: integer("price_cents").notNull().default(799),
    commissionCents: integer("commission_cents").notNull().default(160),
    commissionStatus: text("commission_status").notNull().default("pending"),
    cloudinaryPublicId: text("cloudinary_public_id"),
    croppedImageUrl: text("cropped_image_url"),
    message: text("message"),
    customerEmail: text("customer_email"),
    orderReference: text("order_reference"),
    recipientName: text("recipient_name"),
    recipientStreet: text("recipient_street"),
    recipientPostal: text("recipient_postal"),
    recipientCity: text("recipient_city"),
    recipientCountry: text("recipient_country"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    prodigiOrderId: text("prodigi_order_id"),
    prodigiStatus: text("prodigi_status"),
    emailsSent: boolean("emails_sent").notNull().default(false),
    status: text("status").notNull().default("pending"),
    signatureUrl: text("signature_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "format_check",
      sql`${table.format} IN ('standard', 'large')`
    ),
    check(
      "status_check",
      sql`${table.status} IN ('pending', 'paid', 'printing', 'shipped', 'cancelled', 'paid_print_failed')`
    ),
    check(
      "commission_status_check",
      sql`${table.commissionStatus} IN ('pending', 'held', 'manually_paid')`
    ),
    index("idx_orders_hotel_status").on(table.hotelId, table.status),
    index("idx_orders_created_at").on(table.createdAt),
    index("idx_orders_stripe_pi").on(table.stripePaymentIntentId),
  ]
);

export const agreements = pgTable(
  "agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id),
    templateKey: text("template_key").notNull().default("hotel_partner_v1"),
    contractNr: text("contract_nr").notNull().unique(),
    status: text("status").notNull().default("draft"),
    variables: jsonb("variables").$type<Record<string, string>>().notNull(),
    signToken: uuid("sign_token").notNull().unique().defaultRandom(),
    signedPdfUrl: text("signed_pdf_url"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    signedByHotelAt: timestamp("signed_by_hotel_at", { withTimezone: true }),
    signedByPostyourcardAt: timestamp("signed_by_postyourcard_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "agreement_status_check",
      sql`${table.status} IN ('draft', 'sent', 'opened', 'signed_by_hotel', 'completed', 'cancelled')`
    ),
    index("idx_agreements_hotel").on(table.hotelId),
    index("idx_agreements_status").on(table.status),
  ]
);

export const agreementSignatures = pgTable(
  "agreement_signatures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade" }),
    party: text("party").notNull(),
    signerName: text("signer_name").notNull(),
    signerEmail: text("signer_email").notNull(),
    signerFunction: text("signer_function"),
    signatureDataUrl: text("signature_data_url").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "signature_party_check",
      sql`${table.party} IN ('hotel', 'postyourcard')`
    ),
    index("idx_signatures_agreement").on(table.agreementId),
  ]
);

export const agreementEvents = pgTable(
  "agreement_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_events_agreement").on(table.agreementId, table.createdAt),
  ]
);
