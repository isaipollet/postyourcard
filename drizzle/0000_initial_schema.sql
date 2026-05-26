-- ============================================
-- PostYourCard — Initial Schema (Neon PostgreSQL)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HOTELS
-- ============================================
CREATE TABLE hotels (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      text NOT NULL,
  slug                      text UNIQUE NOT NULL,
  email                     text NOT NULL,
  logo_url                  text,
  stripe_account_id         text,
  stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  commission_pct            numeric NOT NULL DEFAULT 0.20,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hotels_slug ON hotels (slug);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id                  uuid NOT NULL REFERENCES hotels(id),
  format                    text NOT NULL CHECK (format IN ('standard', 'large')),
  price_cents               int NOT NULL DEFAULT 799,
  commission_cents          int NOT NULL DEFAULT 160,
  commission_status         text NOT NULL DEFAULT 'pending'
                            CHECK (commission_status IN ('pending', 'transferred', 'held', 'manually_paid')),
  cloudinary_public_id      text,
  cropped_image_url         text,
  message                   text,
  customer_email            text,
  order_reference           text UNIQUE,
  recipient_name            text,
  recipient_street          text,
  recipient_postal          text,
  recipient_city            text,
  recipient_country         text,
  stripe_payment_intent_id  text,
  prodigi_order_id          text,
  prodigi_status            text,
  emails_sent               boolean NOT NULL DEFAULT false,
  status                    text NOT NULL DEFAULT 'pending'
                            CHECK (status IN (
                              'pending',
                              'paid',
                              'printing',
                              'shipped',
                              'cancelled',
                              'paid_print_failed'
                            )),
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_hotel_id ON orders (hotel_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_stripe_pi ON orders (stripe_payment_intent_id);

-- ============================================
-- VIEW — hotels with order stats
-- ============================================
CREATE VIEW hotel_stats AS
SELECT
  h.id,
  h.name,
  h.slug,
  h.email,
  h.logo_url,
  h.stripe_account_id,
  h.stripe_onboarding_complete,
  h.commission_pct,
  h.created_at,
  COUNT(o.id)::int AS order_count,
  COALESCE(SUM(o.price_cents) FILTER (WHERE o.status NOT IN ('pending', 'cancelled')), 0)::int AS total_revenue_cents,
  COALESCE(SUM(o.commission_cents) FILTER (WHERE o.status NOT IN ('pending', 'cancelled')), 0)::int AS total_commission_cents
FROM hotels h
LEFT JOIN orders o ON o.hotel_id = h.id
GROUP BY h.id;
