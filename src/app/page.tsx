import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import HomeHero from "@/components/HomeHero";

export default function Home() {
  return (
    <LanguageProvider detectBrowserLanguage={false}>
      <HomeHero />
    </LanguageProvider>
  );
}
