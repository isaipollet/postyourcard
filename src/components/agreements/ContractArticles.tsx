import React from "react";

export function Article({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
      <header className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-sand-100">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B1F2A] to-[#5A1822] text-white flex items-center justify-center shadow-sm relative">
          <span className="absolute top-1 left-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold opacity-60">
            Art.
          </span>
          <span className="font-sans font-bold text-xl tabular-nums tracking-tight mt-1.5">
            {num.toString().padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-heading text-xl font-medium text-gray-900 leading-tight">
          {title}
        </h3>
      </header>
      <div className="px-6 py-5 text-[15px] text-gray-700 leading-relaxed space-y-3">
        {children}
      </div>
    </article>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 leading-relaxed">
      <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-[#C9963A]" />
      <span className="flex-1">{children}</span>
    </li>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#6B1F2A]/[0.08] text-[#6B1F2A] font-semibold whitespace-nowrap">
      {children}
    </span>
  );
}

export default function ContractArticles({
  hotelName,
  commissionPct,
  commission,
}: {
  hotelName: string;
  commissionPct: number;
  commission: string;
}) {
  return (
    <div className="space-y-3">
      <Article num={1} title="Doel van de overeenkomst">
        <p>
          PostYourCard biedt een digitale service waarmee hotelgasten via een QR-code
          eigen foto&apos;s kunnen uploaden en als fysieke postkaart laten verzenden naar
          een adres naar keuze.
        </p>
        <p>
          <strong className="text-gray-900">{hotelName}</strong> stelt de service
          beschikbaar via QR-codes in de hotelfaciliteiten en ontvangt per verkoop een
          commissie (zie artikel 4).
        </p>
      </Article>

      <Article num={2} title="Verplichtingen PostYourCard">
        <ul className="space-y-2">
          <Bullet>
            Technisch platform onderhouden voor uploaden, personaliseren en bestellen.
          </Bullet>
          <Bullet>Unieke QR-code leveren binnen 5 werkdagen na ondertekening.</Bullet>
          <Bullet>
            Postkaarten van professionele kwaliteit produceren (min. 300 gsm).
          </Bullet>
          <Bullet>Postkaarten binnen 2–5 werkdagen na betaling drukken en verzenden.</Bullet>
          <Bullet>Veilige betaling via Stripe (Bancontact en creditcard).</Bullet>
          <Bullet>
            Maandelijks overzicht van postkaarten, commissie en transactiedetails.
          </Bullet>
          <Bullet>Hotel voorzien van QR-codes, marketingmaterialen en instructies.</Bullet>
        </ul>
      </Article>

      <Article num={3} title="Verplichtingen Hotel">
        <ul className="space-y-2">
          <Bullet>QR-codes prominent plaatsen op minimaal 3 locaties.</Bullet>
          <Bullet>Service actief promoten bij check-in en via gastenmap.</Bullet>
          <Bullet>Hotelpersoneel informeren over de service.</Bullet>
          <Bullet>QR-codes intact houden — niet beschadigen of verwijderen.</Bullet>
        </ul>
      </Article>

      <Article num={4} title="Financiële overeenkomst">
        <p>
          PostYourCard biedt de service aan voor <Highlight>€7,99 per postkaart</Highlight>{" "}
          (verzending inclusief), voor beide formaten.
        </p>
        <p>
          Hotel ontvangt{" "}
          <Highlight>
            {commissionPct}% commissie = €{commission} per verkoop
          </Highlight>
          . PostYourCard behoudt de overige {100 - commissionPct}%.
        </p>
        <p>
          Commissies worden maandelijks uitbetaald via{" "}
          <strong className="text-gray-900">Stripe Connect</strong> binnen 5 werkdagen na
          maandafsluiting, mits een minimum van €25,00 bereikt is. Niet uitbetaalde saldi
          rollen door naar de volgende maand. Alle Stripe-fees zijn voor rekening van
          PostYourCard.
        </p>
      </Article>

      <Article num={5} title="Looptijd en opzegging">
        <p>
          Contract geldig voor <Highlight>12 maanden</Highlight> vanaf ingangsdatum,
          automatisch verlengd met periodes van 1 jaar.
        </p>
        <p>
          Opzegging schriftelijk (aangetekend of e-mail met bevestiging) ten minste{" "}
          <Highlight>3 maanden</Highlight> vóór einde contractperiode.
        </p>
      </Article>

      <Article num={6} title="Intellectuele eigendom">
        <p>
          &quot;PostYourCard&quot;, het logo en alle branding blijven eigendom van
          PostYourCard. Hotel ontvangt een niet-exclusief gebruiksrecht voor de looptijd
          van het contract. Klantenfoto&apos;s blijven eigendom van de klanten.
        </p>
      </Article>

      <Article num={7} title="Privacy en AVG">
        <p>
          Beide partijen leven de AVG (Verordening 2016/679) na. Klantgegevens worden
          maximaal <Highlight>7 jaar</Highlight> bewaard. PostYourCard treedt op als
          verwerkingsverantwoordelijke voor klantbestellingen en implementeert passende
          technische en organisatorische beveiligingsmaatregelen. Een afzonderlijke
          verwerkersovereenkomst (DPA) maakt op verzoek deel uit van deze overeenkomst.
        </p>
      </Article>

      <Article num={8} title="Aansprakelijkheid">
        <p>
          De aansprakelijkheid van elke partij is beperkt tot directe schade en maximaal de
          commissies betaald gedurende de laatste 3 maanden. Geen aansprakelijkheid voor
          vertragingen door externe leveranciers, storingen buiten controle of onjuiste
          adressen aangeleverd door klanten.
        </p>
      </Article>

      <Article num={9} title="Toepasselijk recht">
        <p>
          Op deze overeenkomst is het{" "}
          <strong className="text-gray-900">Belgisch recht</strong> van toepassing. De
          rechtbanken van <strong className="text-gray-900">Brugge</strong> zijn exclusief
          bevoegd.
        </p>
      </Article>
    </div>
  );
}
