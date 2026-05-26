export type TemplateVariable = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "number" | "email";
  required?: boolean;
  defaultValue?: string;
};

export type TemplateDef = {
  key: string;
  name: string;
  description: string;
  variables: TemplateVariable[];
};

const POSTYOURCARD_INFO = {
  legalName: process.env.POSTYOURCARD_LEGAL_NAME || "PostYourCard",
  ondNr: process.env.POSTYOURCARD_OND_NR || "[ondernemingsnummer]",
  address: process.env.POSTYOURCARD_ADDRESS || "[adres]",
  city: process.env.POSTYOURCARD_CITY || "[postcode] [stad], België",
  email: process.env.POSTYOURCARD_EMAIL || "info@postyourcard.com",
  btw: process.env.POSTYOURCARD_BTW || "[BTW nummer]",
};

export function getPostYourCardInfo() {
  return POSTYOURCARD_INFO;
}

export const TEMPLATES: Record<string, TemplateDef> = {
  hotel_partner_v1: {
    key: "hotel_partner_v1",
    name: "Hotel Partner Overeenkomst",
    description: "Standaard samenwerkingsovereenkomst PostYourCard × Hotel",
    variables: [
      { key: "hotel_name", label: "Hotel naam", required: true },
      { key: "hotel_address", label: "Adres", placeholder: "Straat + nr", required: true },
      { key: "hotel_city", label: "Postcode + stad", placeholder: "8000 Brugge", required: true },
      { key: "hotel_email", label: "E-mail (contactpersoon)", type: "email", required: true },
      { key: "hotel_btw", label: "BTW nummer", placeholder: "BE0123.456.789", required: true },
      { key: "ingangsdatum", label: "Ingangsdatum", type: "date", required: true },
      {
        key: "commission_pct",
        label: "Commissie %",
        type: "number",
        defaultValue: "15",
        required: true,
      },
    ],
  },
};

export function getTemplate(key: string): TemplateDef {
  const t = TEMPLATES[key];
  if (!t) throw new Error(`Unknown template: ${key}`);
  return t;
}

export function generateContractNr(hotelName: string): string {
  const slug = hotelName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PYC-${slug}-${year}-${rand}`;
}

export function commissionCentsFromPct(pct: number, priceCents = 799): number {
  return Math.round((priceCents * pct) / 100);
}
