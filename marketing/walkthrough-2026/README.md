# Customer journey walkthrough · voorjaar 2026

7-pagina A4-landscape deck dat de stappen toont die een festivalbezoeker doorloopt — van QR-scan tot betaling — met echte screenshots van de PostYourCard webapp.

## Slides

1. Cover
2. Stap 01 · Scan — hand-met-telefoon-scant-QR-code (real-world foto)
3. Stap 02 · Formaat — landing page screenshot (festival-look met Festival 2026 titel)
4. Stap 03 · Foto — upload + crop UI
5. Stap 04 · Bericht — message + 4 handschrift-fonts
6. Stap 05 · Adres — adresvelden + e-mail
7. Stap 06 · Betalen — Stripe checkout

## Bestanden

- `pitch.html` — editable bron (links tekst, rechts phone-mockup met screenshot)
- `pitch-share.html` — standalone met fonts + images base64-embed (gegenereerd via `_scripts/embed.py`)
- `pitch.pdf` — print-klare A4 liggend (gegenereerd via `_scripts/render-pdf.py`)
- `images/` — 5 webapp-screenshots + step-scan.jpg

## Screenshots regenereren

De screenshots zijn gemaakt op localhost:3000/order/hotel-brugge met overrides:
- Hero img → festival-crowd.jpg (base64)
- Hotel name → "Festival 2026"
- Eyebrow "BRUGES" → "THE FESTIVAL"

Als je nieuwe screenshots wil maken (bv. na UI-wijzigingen), draai de Playwright-flow opnieuw met dezelfde DOM-overrides. Dev server moet draaien op :3000 met hotel-brugge in DB.
