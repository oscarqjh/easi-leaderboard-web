import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: SITE_URL },
};

export default function Home() {
  return <LandingPage />;
}
