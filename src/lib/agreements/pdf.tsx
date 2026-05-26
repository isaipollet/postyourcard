import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";
import { getPostYourCardInfo } from "./templates";

const BURGUNDY = "#6B1F2A";
const GOLD = "#C9963A";
const CREAM = "#FAF6EE";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const RULE = "#E5DDD0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BURGUNDY,
  },
  brand: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contractRef: {
    fontSize: 8,
    color: MUTED,
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contractNr: {
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: MUTED,
    marginBottom: 24,
  },
  partiesRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 20,
  },
  partyBlock: {
    flex: 1,
    padding: 12,
    backgroundColor: CREAM,
    borderLeftWidth: 2,
    borderLeftColor: BURGUNDY,
  },
  partyLabel: {
    fontSize: 8,
    color: BURGUNDY,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 9,
    color: INK,
    marginBottom: 1,
  },
  ingangBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginBottom: 20,
  },
  ingangLabel: {
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ingangValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  article: {
    marginBottom: 14,
  },
  articleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  articleNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BURGUNDY,
    color: "white",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3,
  },
  articleTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  articleBody: {
    fontSize: 10,
    color: INK,
    paddingLeft: 26,
  },
  bullet: {
    flexDirection: "row",
    fontSize: 10,
    paddingLeft: 26,
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    color: GOLD,
  },
  bulletText: {
    flex: 1,
  },
  highlight: {
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
  },
  signatureGrid: {
    marginTop: 28,
    flexDirection: "row",
    gap: 32,
  },
  signatureBlock: {
    flex: 1,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  signatureRole: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  signatureField: {
    flexDirection: "row",
    fontSize: 9,
    marginBottom: 4,
  },
  signatureFieldLabel: {
    width: 70,
    color: MUTED,
  },
  signatureFieldValue: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },
  signatureImage: {
    height: 50,
    marginTop: 6,
    marginBottom: 4,
    objectFit: "contain",
    objectPosition: "left",
  },
  signaturePending: {
    height: 50,
    marginTop: 6,
    marginBottom: 4,
    color: MUTED,
    fontStyle: "italic",
    fontSize: 9,
    paddingTop: 18,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: RULE,
  },
  // Audit page
  auditTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
    marginBottom: 4,
  },
  auditSub: {
    fontSize: 10,
    color: MUTED,
    marginBottom: 16,
  },
  auditRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    fontSize: 9,
  },
  auditTime: {
    width: 130,
    color: MUTED,
  },
  auditType: {
    width: 100,
    fontFamily: "Helvetica-Bold",
    color: BURGUNDY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 8,
  },
  auditBody: {
    flex: 1,
  },
});

export type AgreementPdfData = {
  contractNr: string;
  ingangsdatum: string;
  commissionPct: number;
  hotel: {
    name: string;
    address: string;
    city: string;
    email: string;
    btw: string;
  };
  signatures?: {
    hotel?: SignatureRecord;
    postyourcard?: SignatureRecord;
  };
  audit?: AuditEvent[];
};

export type SignatureRecord = {
  name: string;
  email: string;
  fn?: string | null;
  signedAt: Date;
  dataUrl: string;
};

export type AuditEvent = {
  type: string;
  createdAt: Date;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AUDIT_TYPE_LABEL: Record<string, string> = {
  created: "Aangemaakt",
  sent: "Verzonden",
  opened: "Geopend",
  signed_hotel: "Hotel getekend",
  signed_postyourcard: "PostYourCard getekend",
  completed: "Voltooid",
};

export function AgreementDocument({ data }: { data: AgreementPdfData }) {
  const pyc = getPostYourCardInfo();
  const commission = ((799 * data.commissionPct) / 100 / 100).toFixed(2);
  const hotelShare = ((100 - data.commissionPct) / 100) * 7.99;

  return (
    <Document
      title={`PostYourCard Samenwerkingsovereenkomst ${data.contractNr}`}
      author="PostYourCard"
      subject="Samenwerkingsovereenkomst"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>PostYourCard</Text>
            <Text style={styles.brandSub}>Samenwerkingsovereenkomst</Text>
          </View>
          <View>
            <Text style={styles.contractRef}>Contract</Text>
            <Text style={styles.contractNr}>{data.contractNr}</Text>
          </View>
        </View>

        <Text style={styles.title}>SAMENWERKINGSOVEREENKOMST</Text>
        <Text style={styles.subtitle}>PostYourCard × {data.hotel.name}</Text>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>PostYourCard</Text>
            <Text style={styles.partyName}>{pyc.legalName}</Text>
            <Text style={styles.partyLine}>{pyc.address}</Text>
            <Text style={styles.partyLine}>{pyc.city}</Text>
            <Text style={styles.partyLine}>{pyc.email}</Text>
            <Text style={styles.partyLine}>BTW: {pyc.btw}</Text>
            <Text style={styles.partyLine}>Ond.nr.: {pyc.ondNr}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Hotel Partner</Text>
            <Text style={styles.partyName}>{data.hotel.name}</Text>
            <Text style={styles.partyLine}>{data.hotel.address}</Text>
            <Text style={styles.partyLine}>{data.hotel.city}</Text>
            <Text style={styles.partyLine}>{data.hotel.email}</Text>
            <Text style={styles.partyLine}>BTW: {data.hotel.btw}</Text>
          </View>
        </View>

        <View style={styles.ingangBlock}>
          <Text style={styles.ingangLabel}>Ingangsdatum</Text>
          <Text style={styles.ingangValue}>{fmtDate(data.ingangsdatum)}</Text>
        </View>

        <Article num={1} title="Doel van de overeenkomst">
          <Text style={styles.articleBody}>
            PostYourCard biedt een digitale service waarmee hotelgasten via een QR-code eigen
            foto&apos;s kunnen uploaden en als fysieke postkaart laten verzenden naar een adres
            naar keuze. Hotel stelt de service beschikbaar via QR-codes in de
            hotelfaciliteiten en ontvangt per verkoop een commissie (zie Artikel 4).
          </Text>
        </Article>

        <Article num={2} title="Verplichtingen PostYourCard">
          <Bullet>Technisch platform onderhouden voor uploaden, personaliseren en bestellen van postkaarten.</Bullet>
          <Bullet>Unieke QR-code leveren binnen 5 werkdagen na ondertekening.</Bullet>
          <Bullet>Postkaarten van professionele kwaliteit produceren (standaard 105×148 mm / groot 99×210 mm, min. 300 gsm).</Bullet>
          <Bullet>Postkaarten binnen 2–5 werkdagen na betaling drukken en verzenden.</Bullet>
          <Bullet>Veilige betaling via Stripe (inclusief Bancontact en creditcard).</Bullet>
          <Bullet>Maandelijks overzicht: aantal postkaarten, commissie en transactiedetails.</Bullet>
          <Bullet>Helpdesk bereikbaar via {pyc.email}.</Bullet>
          <Bullet>Hotel voorzien van QR-codes, marketingmaterialen en instructies.</Bullet>
        </Article>

        <Article num={3} title="Verplichtingen Hotel">
          <Bullet>QR-codes prominent plaatsen op receptiebalie, kamers (opt.) en gemeenschappelijke ruimtes — minimaal 3 locaties.</Bullet>
          <Bullet>Service actief promoten bij check-in en via gastenmap.</Bullet>
          <Bullet>Hotelpersoneel informeren over de service.</Bullet>
          <Bullet>QR-codes intact houden (niet beschadigen of verwijderen).</Bullet>
          <Bullet>PostYourCard tijdig informeren over wijzigingen in contactgegevens.</Bullet>
        </Article>

        <Article num={4} title="Financiële overeenkomst">
          <Text style={styles.articleBody}>
            PostYourCard biedt de service aan voor <Text style={styles.highlight}>€7,99 per
            postkaart</Text> (verzending inclusief), voor beide formaten.
          </Text>
          <Text style={[styles.articleBody, { marginTop: 4 }]}>
            Hotel ontvangt <Text style={styles.highlight}>{data.commissionPct}% commissie =
            €{commission} per verkoop</Text>. PostYourCard behoudt {100 - data.commissionPct}% (€{hotelShare.toFixed(2)}).
          </Text>
          <Text style={[styles.articleBody, { marginTop: 4 }]}>
            Commissies worden maandelijks via Stripe Connect uitbetaald binnen 5 werkdagen na
            maandafsluiting, mits een minimum van €25,00 bereikt is. Niet uitbetaalde saldi
            rollen door naar de volgende maand. Alle Stripe-fees zijn voor rekening van
            PostYourCard.
          </Text>
        </Article>

        <Article num={5} title="Looptijd en opzegging">
          <Text style={styles.articleBody}>
            Contract geldig voor <Text style={styles.highlight}>12 maanden</Text> vanaf
            ingangsdatum, automatisch verlengd met periodes van 1 jaar.
          </Text>
          <Text style={[styles.articleBody, { marginTop: 4 }]}>
            Opzegging schriftelijk (aangetekend of e-mail met bevestiging) ten minste{" "}
            <Text style={styles.highlight}>3 maanden</Text> vóór einde contractperiode.
          </Text>
        </Article>

        <Article num={6} title="Intellectuele eigendom">
          <Text style={styles.articleBody}>
            &quot;PostYourCard&quot;, het logo en alle branding blijven eigendom van
            PostYourCard. Hotel ontvangt een niet-exclusief gebruiksrecht voor de looptijd van
            het contract. Klantenfoto&apos;s blijven eigendom van de klanten.
          </Text>
        </Article>

        <Article num={7} title="Privacy en AVG">
          <Text style={styles.articleBody}>
            Beide partijen leven de AVG (Verordening 2016/679) na. Klantgegevens worden
            maximaal 7 jaar bewaard. PostYourCard treedt op als verwerkingsverantwoordelijke
            voor klantbestellingen. PostYourCard implementeert passende technische en
            organisatorische beveiligingsmaatregelen. Een afzonderlijke
            verwerkersovereenkomst (DPA) maakt op verzoek deel uit van deze overeenkomst.
          </Text>
        </Article>

        <Article num={8} title="Aansprakelijkheid">
          <Text style={styles.articleBody}>
            De aansprakelijkheid van elke partij is beperkt tot directe schade en maximaal de
            commissies betaald gedurende de laatste 3 maanden. Geen aansprakelijkheid voor
            vertragingen door externe leveranciers, storingen buiten controle of onjuiste
            adressen aangeleverd door klanten.
          </Text>
        </Article>

        <Article num={9} title="Toepasselijk recht">
          <Text style={styles.articleBody}>
            Op deze overeenkomst is het <Text style={styles.highlight}>Belgisch recht</Text>{" "}
            van toepassing. De rechtbanken van <Text style={styles.highlight}>Brugge</Text>{" "}
            zijn exclusief bevoegd.
          </Text>
        </Article>

        <View style={styles.signatureGrid} wrap={false}>
          <SignatureColumn
            role="PostYourCard"
            signature={data.signatures?.postyourcard}
          />
          <SignatureColumn role="Hotel Partner" signature={data.signatures?.hotel} />
        </View>

        <View style={styles.footer} fixed>
          <Text>{data.contractNr}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} / ${totalPages}`
            }
          />
          <Text>postyourcard.com</Text>
        </View>
      </Page>

      {data.audit && data.audit.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header} fixed>
            <View>
              <Text style={styles.brand}>PostYourCard</Text>
              <Text style={styles.brandSub}>Audit Trail</Text>
            </View>
            <View>
              <Text style={styles.contractRef}>Contract</Text>
              <Text style={styles.contractNr}>{data.contractNr}</Text>
            </View>
          </View>

          <Text style={styles.auditTitle}>Audit trail</Text>
          <Text style={styles.auditSub}>
            Onweerlegbaar overzicht van alle gebeurtenissen rond deze overeenkomst, conform
            eIDAS-vereisten voor elektronische ondertekening (SES).
          </Text>

          {data.audit.map((evt, i) => (
            <View key={i} style={styles.auditRow}>
              <Text style={styles.auditTime}>{fmtDateTime(evt.createdAt)}</Text>
              <Text style={styles.auditType}>
                {AUDIT_TYPE_LABEL[evt.type] || evt.type}
              </Text>
              <Text style={styles.auditBody}>
                {evt.ip ? `IP ${evt.ip}` : ""}
                {evt.ip && evt.userAgent ? "  ·  " : ""}
                {evt.userAgent ? truncateUA(evt.userAgent) : ""}
              </Text>
            </View>
          ))}

          <View style={styles.footer} fixed>
            <Text>{data.contractNr}</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                `Pagina ${pageNumber} / ${totalPages}`
              }
            />
            <Text>postyourcard.com</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

function Article({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.article} wrap={false}>
      <View style={styles.articleHeader}>
        <Text style={styles.articleNum}>{num}</Text>
        <Text style={styles.articleTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function SignatureColumn({
  role,
  signature,
}: {
  role: string;
  signature?: SignatureRecord;
}) {
  return (
    <View style={styles.signatureBlock}>
      <Text style={styles.signatureRole}>{role}</Text>
      {signature ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={signature.dataUrl} style={styles.signatureImage} />
          <View style={styles.signatureField}>
            <Text style={styles.signatureFieldLabel}>Naam</Text>
            <Text style={styles.signatureFieldValue}>{signature.name}</Text>
          </View>
          {signature.fn && (
            <View style={styles.signatureField}>
              <Text style={styles.signatureFieldLabel}>Functie</Text>
              <Text style={styles.signatureFieldValue}>{signature.fn}</Text>
            </View>
          )}
          <View style={styles.signatureField}>
            <Text style={styles.signatureFieldLabel}>E-mail</Text>
            <Text style={styles.signatureFieldValue}>{signature.email}</Text>
          </View>
          <View style={styles.signatureField}>
            <Text style={styles.signatureFieldLabel}>Datum</Text>
            <Text style={styles.signatureFieldValue}>
              {fmtDateTime(signature.signedAt)}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.signaturePending}>— wacht op handtekening —</Text>
          <View style={styles.signatureField}>
            <Text style={styles.signatureFieldLabel}>Naam</Text>
            <Text style={styles.signatureFieldValue}> </Text>
          </View>
          <View style={styles.signatureField}>
            <Text style={styles.signatureFieldLabel}>Functie</Text>
            <Text style={styles.signatureFieldValue}> </Text>
          </View>
          <View style={styles.signatureField}>
            <Text style={styles.signatureFieldLabel}>Datum</Text>
            <Text style={styles.signatureFieldValue}> </Text>
          </View>
        </>
      )}
    </View>
  );
}

function truncateUA(ua: string) {
  return ua.length > 60 ? ua.slice(0, 57) + "…" : ua;
}

export async function renderAgreementPdf(data: AgreementPdfData): Promise<Buffer> {
  const stream = await pdf(<AgreementDocument data={data} />).toBuffer();
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
