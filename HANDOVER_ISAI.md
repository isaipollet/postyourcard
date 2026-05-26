# PostYourCard — Handover voor Isaï

**Doel:** alles wat jij zelfstandig kunt opzetten zonder dat Remy ernaast moet zitten. Volg de stappen op volgorde — sla niets over.

Tijd in totaal: **±3 uur** (kan over meerdere dagen).

Wat je per stap aan Remy moet doorgeven, staat steeds met 📩.

---

## 1️⃣ Stripe Live Mode (~45 min)

**Doel:** echte betalingen ontvangen + commissies aan hotels uitbetalen.

### Voorbereiden — leg klaar:
- ID-kaart of paspoort (foto front + achterkant)
- Ondernemingsnummer (BE0...)
- BTW-nummer (BE0...)
- IBAN van je zakelijke rekening
- Bankafschrift of officieel document met IBAN erop

### Stappen:

1. Ga naar https://dashboard.stripe.com en log in op het PostYourCard-account
2. Linksboven zie je een schakelaar **"Test mode"** — laat die nog even staan
3. Klik linksboven op **"Activate payments"** (of: rechtsboven op je profiel → **"Activate account"**)
4. Vul in:
   - **Bedrijfstype:** eenmanszaak / BV (wat van toepassing)
   - **Land:** België
   - **Bedrijfsnaam:** PostYourCard
   - **Ondernemingsnummer + BTW**
   - **Adres** van bedrijf
   - **Telefoon**
5. Verifieer je identiteit — upload ID-kaart (front en achter)
6. **Bankrekening:** voeg IBAN toe waar uitbetalingen op moeten komen
7. Vul **bedrijfsbeschrijving** in: *"Online platform voor het bestellen en versturen van gepersonaliseerde postkaarten."*
8. **Statistieken** waarom Stripe vraagt:
   - Gemiddeld bedrag per transactie: €7,99
   - Verwacht maandvolume: schat in (bv. €500 in eerste maand)
   - Klanten betalen: vooraf (kaart wordt pas verstuurd na betaling)
9. Klik **"Submit for review"** — Stripe controleert binnen 1-2 werkdagen
10. Je krijgt mail met "Account activated" → daarna kan je Live Mode aanzetten

### Na activatie:

11. Schakel rechtsboven van **"Test mode"** naar **"Live mode"**
12. Ga naar **Developers → API keys**
13. Kopieer:
    - **Publishable key** (start met `pk_live_...`)
    - **Secret key** (start met `sk_live_...`) — klik "Reveal live key"

📩 **Stuur naar Remy:**
- `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_SECRET_KEY=sk_live_...`

---

## 2️⃣ Stripe Webhook aanmaken (~10 min, ná stap 1)

**Doel:** Stripe meldt PostYourCard automatisch wanneer een betaling slaagt → kaart wordt gedrukt.

⚠️ Doe dit **nadat de website live staat** op postyourcard.com (na stap 5).

1. In Stripe dashboard → **Developers → Webhooks**
2. Klik **"Add endpoint"**
3. **Endpoint URL:** `https://postyourcard.com/api/webhooks/stripe`
4. **Description:** `PostYourCard production webhook`
5. **Events to send** — klik "Select events" en vink aan:
   - ☑️ `payment_intent.succeeded`
   - ☑️ `payment_intent.payment_failed`
   - ☑️ `charge.refunded`
6. Klik **"Add endpoint"**
7. Op de detail-pagina van de webhook: klik **"Reveal" naast Signing secret**
8. Kopieer de waarde (start met `whsec_...`)

📩 **Stuur naar Remy:** `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 3️⃣ Resend DNS instellen (~30 min)

**Doel:** PostYourCard kan e-mails versturen vanaf `info@postyourcard.com` zonder in spam te belanden.

### Voorbereiden:
- Login Resend (info@postyourcard.com)
- Login vimexx.nl (waar het domein geregistreerd is)

### Stappen:

1. Ga naar https://resend.com/domains
2. Klik op **`postyourcard.com`** (zou er al moeten staan)
3. Je ziet een lijst met DNS-records die toegevoegd moeten worden — meestal 3 stuks:
   - **DKIM** (TXT record)
   - **SPF** (TXT record)
   - **Return-Path** (CNAME record)
4. Open een tweede tab → **vimexx.nl** → log in
5. Ga naar **Mijn diensten → postyourcard.com → DNS-beheer**
6. Voor elk record uit Resend, klik in vimexx **"Toevoegen DNS-record"**:
   - **Type:** kies wat Resend zegt (TXT, CNAME, MX)
   - **Naam:** kopieer exact uit Resend (bv. `resend._domainkey`)
   - **Waarde:** kopieer exact uit Resend (lange string)
   - **TTL:** 3600 (of laat default)
7. Sla op
8. Wacht 5-30 minuten
9. Terug naar Resend → klik **"Verify"** of **"Check records"**
10. Wacht tot alle records groene vinkjes ✅ hebben

### Test:
11. In Resend → **API Keys → Create API Key**
12. Geef het naam `PostYourCard Production`, scope **"Sending access"**
13. Kopieer de key (start met `re_...`) — wordt maar één keer getoond!

📩 **Stuur naar Remy:**
- `RESEND_API_KEY=re_...`
- Bevestiging dat alle DNS-records groen zijn ✅

---

## 4️⃣ Netlify account + repo connecten (~20 min)

**Doel:** website hosten op `postyourcard.com`.

### Voorbereiden:
- GitHub account (mag een nieuwe zijn — `isaipollet` is in memory)

### Stappen:

1. Ga naar https://www.netlify.com → **"Sign up"** → kies **"Sign up with GitHub"**
2. Autoriseer Netlify om je GitHub repos te zien
3. ⚠️ Vraag eerst aan Remy om de repo `RemyPollet/Postyourcards` over te dragen naar jouw GitHub. Dit moet hij vanuit zijn account doen.
4. Eens overgedragen: in Netlify klik **"Add new site → Import an existing project"**
5. Kies **GitHub** → zoek `Postyourcards` → klik erop
6. **Build settings** (Netlify detecteert Next.js automatisch):
   - **Branch:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
7. ⚠️ **Klik "Show advanced" → "New variable" en voeg deze env vars toe:**

```
DATABASE_URL=                   (vraag aan Remy)
RESEND_API_KEY=                 (van stap 3)
STRIPE_SECRET_KEY=              (van stap 1)
STRIPE_PUBLISHABLE_KEY=         (van stap 1)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= (zelfde als hierboven)
STRIPE_WEBHOOK_SECRET=          (na stap 2)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME= (vraag aan Remy)
CLOUDINARY_API_KEY=             (vraag aan Remy)
CLOUDINARY_API_SECRET=          (vraag aan Remy)
ADMIN_API_KEY=                  (kies een sterk wachtwoord, bv. een Bitwarden-genereerde)
NEXT_PUBLIC_BASE_URL=https://postyourcard.com
POSTYOURCARD_LEGAL_NAME=PostYourCard
POSTYOURCARD_OND_NR=BE0XXX.XXX.XXX
POSTYOURCARD_ADDRESS=Straat + nummer
POSTYOURCARD_CITY=8000 Brugge, België
POSTYOURCARD_BTW=BE0XXX.XXX.XXX
POSTYOURCARD_EMAIL=info@postyourcard.com
```

8. Klik **"Deploy site"** — duurt 3-5 min
9. Je krijgt een tijdelijke URL `https://random-name.netlify.app`
10. Test: open die URL → zou de PostYourCard homepage moeten tonen

📩 **Stuur naar Remy:** Netlify site URL, zodat hij kan controleren

---

## 5️⃣ Domain `postyourcard.com` aan Netlify hangen (~30 min)

**Doel:** je site bereikbaar op je echte domein.

### Stappen:

1. In Netlify → **Site settings → Domain management → Add a domain**
2. Vul in: `postyourcard.com` → klik **"Verify"**
3. Netlify toont 4 nameservers (bv. `dns1.p01.nsone.net`, `dns2.p01.nsone.net`, ...). **Optie A** is om alle DNS over te zetten naar Netlify. **Optie B** is alleen A-records aanpassen.
4. **Eenvoudigste route — Optie B (alleen A-record + CNAME):**
   - Open vimexx → DNS-beheer voor `postyourcard.com`
   - Voeg toe / wijzig:
     - **A record:** `@` → `75.2.60.5` (Netlify Load Balancer IP)
     - **CNAME:** `www` → `<netlify-site-name>.netlify.app`
5. Wacht 5-30 min op DNS propagatie
6. Terug naar Netlify → klik **"Refresh"** bij domain → groen vinkje ✅
7. Netlify maakt automatisch SSL-certificaat aan (wacht 1-5 min)
8. Test: ga naar https://postyourcard.com → zou je site moeten zien

📩 **Stuur naar Remy:** "postyourcard.com is live" zodat hij kan helpen testen

---

## 6️⃣ Cloudinary account (~15 min)

⚠️ Mogelijk al gedaan — vraag eerst aan Remy of er een Cloudinary account onder PostYourCard's naam is. Zo ja, vraag de credentials.

Indien nog niet:

1. Ga naar https://cloudinary.com → **Sign up free**
2. Email: `info@postyourcard.com`
3. Cloud name kiezen: `postyourcard`
4. Free tier (25 credits/maand) volstaat voor de eerste maanden
5. Dashboard → **API Keys**:
   - Cloud name
   - API Key
   - API Secret (klik "Reveal")

📩 **Stuur naar Remy** (als je nieuw account maakt):
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=postyourcard`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

---

## 7️⃣ Eerste smoke-test (~30 min)

Na alle bovenstaande stappen:

1. **Postkaart-flow:**
   - Open https://postyourcard.com/order/hotel-brugge
   - Upload een foto, schrijf een bericht, vul je eigen adres in
   - Betaal met **echte Bancontact** (€7,99)
   - Check je inbox → kreeg je orderbevestiging?
   - Check `info@postyourcard.com` inbox → kreeg je de print-mail met foto + adres?

2. **Agreements-flow:**
   - Login op https://postyourcard.com/admin/login
   - Ga naar **Agreements → Nieuwe overeenkomst**
   - Maak één voor "Hotel Brugge" (of test-hotel)
   - Klik **"Verstuur signing-link"** (gebruik je eigen email als hotel_email zodat jij de link krijgt)
   - Open de link in een ander tabblad → teken
   - Terug naar admin → status moet "Hotel getekend" zijn
   - Klik **"Onderteken namens PostYourCard"** → teken
   - Status wordt "Voltooid" → download de PDF en check of beide handtekeningen erin staan

3. **Geen errors?** ✅ Klaar voor productie!

---

## 8️⃣ Eerste hotel toevoegen (~10 min)

Wanneer je klaar bent om je eerste hotelpartner toe te voegen:

1. Login admin: https://postyourcard.com/admin
2. Klik **"Add hotel"**
3. Vul in:
   - **Hotel name:** echte naam
   - **Email:** contactpersoon hotel
   - **City:** Brugge
   - **Address:** straat + nr
   - **Welcome message:** korte begroeting in het Engels (gasten zien dit)
   - **Hero image URL:** mooie foto van het hotel of Brugge (Unsplash kan)
4. Klik **"Onboarding link"** → kopieer de Stripe Connect onboarding-URL → mail naar hotel
5. Hotel klikt link → vult bankgegevens in via Stripe → komt terug met "onboarding complete"
6. Daarna kan je voor dat hotel een agreement maken én Stripe gaat automatisch 15% commissie naar hen storten

---

## 9️⃣ Handige links na launch

- **Admin:** https://postyourcard.com/admin
- **Stripe dashboard:** https://dashboard.stripe.com/payments
- **Resend logs:** https://resend.com/emails (zie alle verzonden mails)
- **Netlify dashboard:** https://app.netlify.com (deploys, logs, env vars)
- **Cloudinary:** https://cloudinary.com/console (foto's bekijken)
- **Neon (database):** vraag Remy om read-only access als je orders wilt zien

---

## 🆘 Wat doe je bij problemen?

| Probleem | Oplossing |
|---|---|
| Mail komt niet aan | Check Resend → Emails tab, kijk naar status. Als "delivered": kijk in spam |
| Betaling lijkt mislukt maar geld is afgeschreven | Check Stripe dashboard → Payments. Vaak is het wel binnen, alleen webhook traag |
| Site is offline | Check Netlify → Deploys, kijk of laatste deploy faalde |
| Hotel ziet QR-code niet werken | Check `/admin/hotels` of het hotel `active` is + slug klopt in QR |
| Foto's komen wazig aan | Cloudinary credit op? Check dashboard → Usage |

Voor alles wat je niet zelf kunt oplossen: **bel Remy**.

---

Veel succes! 🚀
