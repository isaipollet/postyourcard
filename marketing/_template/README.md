# PostYourCard pitch template

Festival-georiënteerde 6-pagina A4-landscape sales deck. Burgundy/gold/cream design system, Cormorant Garamond + Caveat + Inter, postkaart-mockups en SVG-step-iconen herbruikbaar.

## Hoe gebruiken

1. **Kopieer de folder** naar `marketing/<klant>-<datum>/` (bv. `marketing/tomorrowland-2026/`)
2. **Open `pitch.html`** in een editor
3. **Vervang placeholders:**
   - `{{KLANT}}` — naam van de partner/distributeur (bv. "Tomorrowland", "Live Nation")
   - `{{PERIODE}}` — pitch-periode op cover (bv. "Voorjaar 2026")
   - `{{PERIODE_PILOT}}` — voorgestelde pilot-periode op slide 6 (bv. "zomer 2026")
4. **Plaats foto's** in `images/`:
   - `photo-front.jpg` — voorkant van postkaart op slide 3 (bv. festival crowd)
   - `photo-back.jpg` — voorkant op slide 4 (bv. stage lights, ander festival-moment)
   - Aspect-ratio idealiter 1.4:1 of breder; minimaal 1200px breed
5. **Pas de copy aan** voor de specifieke context:
   - Slide 3 lead + bullets — waarom dit werkt voor deze partner
   - Slide 5 pricing — herzie de getallen (€7.99 visitor / €4-5 bulk zijn placeholders)
   - Slide 6 pilot bullets — concrete deal-voorwaarden

## Slide-structuur

1. Cover — partnership title
2. Wat het is — 3 SVG-stappen (scan / personaliseer / wereldwijd) — herbruikbaar zonder wijziging
3. Why this context — postcard mockup met partner-specifieke foto
4. Branding canvas — achterkant van de kaart als billboard
5. Pricing modellen — visitor-paid + sponsor-paid
6. Pilot voorstel — concrete next step

## Design system

Verander niet zonder reden:
- Kleuren: `--burgundy: #6B1F2A`, `--gold: #C9963A`, `--cream: #FAF6EE`
- Headings: Cormorant Garamond 500 (italic via `<em>`)
- Body: Inter 400-700
- Handwriting: Caveat 500
- Slide-grid: A4 landscape (297 × 210mm), 22mm padding

## Standalone share-versie

Voor delen via Notes/Mail (waar relatieve image-paths breken):

```bash
# Embed images + fonts als base64 — zelfde als Jetimport pitch-share.html
python3 ../_scripts/embed.py pitch.html pitch-share.html
```

(Script is nog niet aangemaakt — zie `marketing/jetimport-2026/pitch-share.html` als voorbeeld van het resultaat. De aanmaak via `python3` met `urllib` + `base64` voor images en Google Fonts woff2's.)

## Niet doen

- Branding wijzigen (PostYourCard logo, kleuren, fonts) — herkenbaarheid
- Cover h1 te lang maken — past niet op één regel
- Postkaart-mockup dimensies veranderen — breaks visual consistency

## Pricing-disclaimers (intern)

- 20% visitor-paid revshare = standaard hotel-commissie. Voor grote partners als Live Nation kan dit oplopen tot 30-35%.
- €4-5 bulk-prijs vanaf 5.000 stuks = schatting o.b.v. printkosten + verzending. Verifieer marge vóór elke pitch.
