# PostYourCard — Full UI Redesign Prompt

## CONTEXT

PostYourCard is a mobile-first web app that lets tourists in Bruges hotels send real printed postcards. The tourist scans a QR code on a flyer in their hotel room, uploads a holiday photo, writes a message, pays €7.99, and we print + mail it worldwide. It's a 4-step flow on a single-page mobile experience. Think of it as the lovechild of Typeform and Artifact Uprising — fast, beautiful, and emotional.

**Target audience:** Tourists (25–65) on holiday in Bruges, using their phone in a hotel room. They're in a good mood, nostalgic, and want to do something personal for someone back home. Many are non-tech-savvy. The entire experience should feel warm, premium, and effortless — like writing a real postcard at a café.

**Brand personality:** Warm, artisanal, trustworthy, slightly nostalgic. Not corporate, not startup-y. Think handwritten letters, old stamps, European café culture.

---

## TECH STACK (do not change)

- Next.js 14 App Router (TypeScript)
- Tailwind CSS
- Zustand (state)
- Stripe Elements (payment)
- Cloudinary Upload Widget (photo upload)
- Google Fonts: Playfair Display (headings) + Inter (body)

---

## DESIGN SYSTEM

### Colors (already in tailwind.config.ts)
- **Teal** `#0F6E56` — primary brand. CTAs, headings, accents. Rich deep green that evokes European elegance.
- **Sand** `#F5E6C8` — warm neutral. Backgrounds, cards, borders. Think old postcard paper, parchment.
- **Background** `#FFFDF9` — warm off-white. Never pure white — everything should feel warm.
- **Foreground** `#1A1A1A` — near-black for body text.
- **Error** — soft red, never aggressive.

### Typography
- **Playfair Display** (`font-heading`) — all headings, prices, order references. Serif, editorial, premium.
- **Inter** (`font-body`) — body text, labels, buttons. Clean and readable.

### Design Tokens / Patterns
- Border radius: `rounded-xl` (12px) for cards, buttons, inputs. `rounded-2xl` (16px) for hero sections.
- Borders: `border-2 border-sand-200` on cards and inputs. Teal border on focus/selected state.
- Shadows: Use `shadow-lg shadow-teal/20` on primary CTAs only. Subtle shadows elsewhere.
- Spacing: Generous. Breathe. This is not a dashboard — it's an emotional experience.
- Transitions: `transition-all` with subtle scale on tap (`active:scale-[0.98]`).
- Loading states: Teal spinner, skeleton shimmer with `bg-sand-200 animate-pulse`.

---

## PAGE-BY-PAGE DESIGN SPEC

### PAGE 0: Landing / Home (`/`)
**Current state:** Minimal — just an icon, title, subtitle, and two buttons.

**Make it stunning:**
- Full-viewport hero with a soft gradient background (warm sand → off-white) or a subtle postcard texture pattern
- The PostYourCard logo/wordmark should feel premium — Playfair Display, slightly larger, with a subtle stamp or postcard icon
- Tagline: "Send a real postcard from your trip" — should feel like a handwritten invitation
- "Try demo" button: primary teal, prominent. Consider adding a small postcard illustration or icon
- "Admin" link: subtle, bottom corner, almost hidden — this is not for customers
- Add subtle floating elements: a tiny stamp, an airplane, a postmark — very light, decorative, not distracting
- Social proof or trust badges: "Printed in 24h" / "Delivered worldwide" / "€7.99 all-in" — three small icons/badges below the CTA
- Footer: minimal, one line: "Made with love in Bruges"

### PAGE 1: Format Selection (`/order/[slug]`)
**Purpose:** Tourist just scanned QR. First impression. Must be warm and clear.

**Header area:**
- Hotel branding: show hotel name with a warm welcome: "Welcome from [Hotel Name]" in Playfair
- If hotel has a logo: show it in a circle with a soft sand border
- If no logo: show a beautiful generic postcard icon (not the current building SVG — too corporate)
- Subtitle: "Send a real postcard from your trip — we'll print it and mail it for you!" — friendly, warm

**Format cards (FormatCard component):**
- These are the hero of this page — make them feel like you're choosing between two beautiful postcards
- Each card should show a **realistic postcard mockup** shape: a rectangle with slightly rounded corners, a subtle drop shadow, maybe a faint stamp in the corner
- Standard (105×148mm): show it portrait-oriented, slightly tilted
- Panoramic (99×210mm): show it landscape-oriented, slightly tilted the other way
- Selected state: teal border glow + subtle scale-up + checkmark badge in corner
- Unselected state: sand border, slightly muted
- Price (€7.99) should be prominent but not aggressive — it's in Playfair, teal colored
- "Shipping included" text should reassure: small, sand-colored, below the price
- Remove the ugly radio-button-style selection indicator at the bottom. The card itself IS the selector.

**Progress bar:**
- Already good. Consider making it thinner and adding a subtle animation when transitioning between steps.
- Step labels (Format / Photo / Message / Payment) are good.

**CTA "Start" button:**
- Change text to "Choose photo" or "Next: Upload photo" — more specific and action-oriented
- Full width, prominent, with the teal shadow

### PAGE 2: Upload & Crop (`/order/[slug]/upload`)
**Purpose:** Upload a holiday photo and crop it to postcard dimensions.

**Empty state (no photo yet):**
- The upload area should look like a blank postcard! A card-shaped dashed border area with:
  - A camera icon (not the current image icon — camera feels more personal)
  - "Tap to choose a photo" (not "Tap to upload" — upload is too technical)
  - "from your camera or gallery" in smaller text
  - Subtle hint: "Tip: landscape photos work best!" in a small pill badge

**After upload (crop mode):**
- The crop overlay should feel polished:
  - Dark overlay (current `bg-black/40` is good)
  - The crop area should have rounded corners to match the postcard feel
  - Corner handles should be more visible — small teal circles instead of white squares
  - Add a subtle "rule of thirds" grid (already exists — make it more visible)
- Buttons below: "Change photo" (outline) and "Confirm crop" (teal)

**After crop confirmed (preview):**
- Show "Your postcard" heading
- The preview should look like a real postcard: add a subtle paper texture, slight drop shadow, maybe a faint postage stamp graphic in the top-right corner
- Below: "Change photo" and "Re-crop" buttons
- CTA: "Next: Write message" — specific action

### PAGE 3: Message & Address (`/order/[slug]/message`)
**Purpose:** Write a heartfelt message and enter the recipient's address.

**Message section:**
- The textarea should feel like you're writing on an actual postcard — consider:
  - A subtle lined background (like ruled paper) using a CSS repeating gradient
  - A slightly different font feel — maybe slightly larger, more personal
  - The character counter (300) should be subtle, only turning red when near limit
- Label: "Write your message" (not "Your personal message" — too formal)
- Placeholder: "Lieve mama, groetjes vanuit Brugge! Het weer is prachtig en..." — in Dutch to match the Bruges context, but keep it light

**Email field:**
- Move it below the address section — the email is less important than the message
- Label: "Your email" with a small "(for order confirmation)" in sand color

**Address section:**
- "Where should we send it?" (not "Delivery address" — too corporate)
- Add a small world map icon or airplane icon next to the heading
- Country dropdown: pre-select Belgium (most common for Bruges tourists writing home)
- Consider adding a small reassurance: "We deliver to 40+ countries" as a subtle note

**Form styling:**
- All inputs should feel consistent: `rounded-xl`, `border-2 border-sand-200`, generous padding
- On focus: smooth teal border transition
- Labels: small, medium weight, gray-700
- Consider grouping the form in a card with a sand background to separate it from the page

### PAGE 4: Checkout (`/order/[slug]/checkout`)
**Purpose:** Review order and pay. Must inspire confidence.

**Order summary card:**
- Make it feel like a receipt/ticket:
  - The postcard image thumbnail should be larger (not just 80x80) — show a proper preview
  - Add a dotted line separator (like a receipt) instead of the plain border
  - Show: format name, dimensions, recipient name + city, price
  - "Shipping included" at the bottom with a subtle checkmark

**Payment section (Stripe Elements):**
- Already well-integrated. Ensure the Stripe Elements appearance matches our design system perfectly
- The lock icon + "Secure payment" text is good — keep it
- Consider adding small payment method logos (Visa, Mastercard, iDEAL, Bancontact) below Stripe

**Pay button:**
- "Pay €7.99" is good
- Add a small lock icon before the text
- Loading state with spinner is good — maybe add "Processing payment..." text

**Trust elements:**
- Add a small row of trust badges: "Secure payment" / "Print in 24h" / "Worldwide delivery"
- Consider a tiny "Money-back guarantee" note

### PAGE 5: Confirmation (`/order/[slug]/confirmed`)
**Purpose:** Celebration! The tourist just did something special for someone.

**Make this page joyful and memorable:**
- The success icon should be bigger and more celebratory — consider a confetti animation or a postcard-flying-away animation
- "Your postcard is on its way!" — large, Playfair, teal. This should feel like the climax of the experience.
- Show a mini timeline: "Printed today → Shipped tomorrow → Arrives in 5-10 days"
- Order reference in a premium-looking card — like a boarding pass stub
- "We've sent a confirmation to your email" — reassuring
- "Send another postcard" button — prominent, because tourists might want to send multiple!
- Consider adding: "Share PostYourCard with a friend" — small social sharing option
- Small footer: "Thank you for choosing PostYourCard. Made with love in Bruges."

---

## COMPONENTS TO IMPROVE

### OrderLayout (header)
- The "PostYourCard" text header is too plain
- Consider a minimal logo: the word "PostYourCard" in Playfair with a tiny stamp/postcard icon
- The header should be sticky on scroll
- Add a very subtle bottom border or shadow when scrolled

### ProgressBar
- Already functional. Polish:
  - Make the connector lines animate/fill when progressing
  - Completed steps: show teal circle with white checkmark (already done)
  - Active step: add a subtle pulse or glow
  - Future steps: sand-colored, clearly inactive
  - On mobile, consider hiding labels and only showing on active step to save space

### FormatCard
- Redesign per PAGE 1 spec above
- The postcard shape preview should be the hero — not a tiny 30x28px box

### InstallPrompt (PWA)
- Only show after order confirmation (don't interrupt the flow)
- Make it dismissible and non-intrusive — a small bottom sheet, not a modal

---

## GLOBAL UX POLISH

### Animations & Transitions
- Page transitions: subtle fade-in when navigating between steps
- Button press: `active:scale-[0.98]` — already good
- Loading states: use skeleton screens (sand-200 shimmer), never blank screens
- Success states: use a brief scale-up + fade-in animation

### Mobile-First Details
- All touch targets: minimum 44px height
- No horizontal scroll anywhere
- Inputs should not zoom on iOS (already handled via viewport meta)
- Bottom padding on all pages for safe area on notched phones
- Scroll behavior: smooth, no janky jumps

### Empty / Error States
- Hotel not found: friendly message with the PostYourCard branding, not a bare 404
- Payment failed: clear error message with "Try again" button, not just red text
- No internet: the PWA offline page should match the brand

### Accessibility
- All interactive elements have focus-visible rings (teal color)
- Proper label associations on all form inputs
- Sufficient color contrast (teal on white = 4.8:1, good)
- Alt text on all images

---

## VISUAL REFERENCES / MOOD

Think of these brands for visual inspiration:
- **Artifact Uprising** — premium photo products, warm and personal
- **Papier** — stationery brand, elegant and tactile
- **Typeform** — smooth step-by-step flow, one thing at a time
- **Wise (TransferWise)** — trust, clarity, beautiful forms
- The PostYourCard flyer itself (warm tones, Bruges photography, handwritten feel, gold accents on cream background)

---

## WHAT NOT TO DO

- No dark mode (this is a warm, sunny holiday app)
- No complex animations that slow down mobile (tourists have bad hotel wifi)
- No modals or popups (except the Cloudinary upload widget which we can't control)
- No cookie banners or popups interrupting the flow
- No stock photography — use illustrations or icons instead
- No blue links — everything uses teal
- Don't make it look like a SaaS dashboard — it should feel like a boutique service
- Don't over-design the admin pages — those can stay functional. Focus all design effort on the customer-facing order flow.
