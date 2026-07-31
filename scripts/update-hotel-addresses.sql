-- Update hotel addresses for all 10 Brugge partner hotels
-- Run this in the Neon console or via psql with DATABASE_URL

UPDATE hotels SET address = 'Prinsenhof 8, 8000 Brugge'                WHERE slug = 'hotel-dukes-palace-brugge';
UPDATE hotels SET address = 'Heilige-Geeststraat 1, 8000 Brugge'        WHERE slug = 'hotel-de-castillion';
UPDATE hotels SET address = 'Niklaas Desparsstraat 11, 8000 Brugge'     WHERE slug LIKE '%heritage%';
UPDATE hotels SET address = 'Sint-Jakobsstraat 41, 8000 Brugge'         WHERE slug = 'hotel-navarra-brugge';
UPDATE hotels SET address = 'Kartuizerinnenstraat 10, 8000 Brugge'      WHERE slug = 'hotel-de-orangerie';
UPDATE hotels SET address = 'Pandreitje 16, 8000 Brugge'                WHERE slug = 'the-pand-hotel';
UPDATE hotels SET address = 'Wollestraat 41, 8000 Brugge'               WHERE slug = 'relais-bourgondisch-cruyce';
UPDATE hotels SET address = 'Walplein 14, 8000 Brugge'                  WHERE slug = 'boutique-hotel-sablon';
UPDATE hotels SET address = 'Steenhouwersdijk 1, 8000 Brugge'           WHERE slug = 'die-swaene';
UPDATE hotels SET address = 'Molenmeers 11, 8000 Brugge'                WHERE slug = 'hotel-van-cleef';

-- Verify
SELECT name, slug, address FROM hotels ORDER BY name;
