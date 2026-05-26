# Marketing scripts

## Workflow voor een nieuwe pitch

```bash
# 1. Maak nieuwe folder vanuit template
cp -r marketing/_template marketing/<klant>-<datum>

# 2. Edit pitch.html (vervang {{KLANT}}, {{PERIODE}}, etc.) en drop foto's in images/

# 3. Genereer standalone share-versie (fonts + images base64-embed)
python3 marketing/_scripts/embed.py marketing/<klant>-<datum>

# 4. Genereer PDF via Playwright screenshots
python3 marketing/_scripts/render-pdf.py marketing/<klant>-<datum>
```

Resultaat:
- `pitch.html` — editable bron
- `pitch-share.html` — 3MB standalone, deelbaar via Notes/Mail
- `pitch.pdf` — 1MB print-klare PDF, A4 liggend

## Eenmalige setup

```bash
pip install playwright pillow
python -m playwright install chromium
```

## Waarom screenshot-PDF en niet `--print-to-pdf`?

Chrome's PDF print engine heeft een bug waardoor rotated absolute-positioned
elementen met box-shadows verkeerd renderen — shadows worden solid rechthoeken,
transforms worden genegeerd. Onze postkaart-mockups gebruiken precies die combo
(rotate + absolute + box-shadow). De fix is om elke slide te screenshotten via
de gewone Chromium compositor (die geen bug heeft) en de PNG's als PDF-pagina's
te assembleren via PIL.

Trade-off: PDF is een collectie images, geen geselecteerbare tekst. Voor een
sales pitch waarbij de visual primaire is, is dat acceptabel.
