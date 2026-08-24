import { connectToDatabase } from "@/lib/db";
import { SiteContentModel, SITE_CONTENT_SINGLETON_KEY } from "@/models/SiteContent";

// Revalidate periodically so CMS edits (hero copy, banners) go live without a full redeploy.
export const revalidate = 60;
import { BannerStrip } from "@/components/landing/banner-strip";
import { Hero } from "@/components/landing/hero";
import { TickerTape } from "@/components/landing/ticker-tape";
import { MarketOverview } from "@/components/landing/market-overview";
import { NewsSection } from "@/components/landing/news-section";
import { AiAssistantPreview } from "@/components/landing/ai-assistant-preview";
import { StakingProducts } from "@/components/landing/staking-products";
import { DepositCrypto } from "@/components/landing/deposit-crypto";
import { DownloadApp } from "@/components/landing/download-app";
import { SecuritySection } from "@/components/landing/security-section";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";

async function getSiteContent() {
  try {
    await connectToDatabase();
    const content = await SiteContentModel.findOne({ key: SITE_CONTENT_SINGLETON_KEY }).lean();
    return {
      heroHeadline: content?.heroHeadline,
      heroSubheadline: content?.heroSubheadline,
      banners: (content?.banners ?? []).filter((b) => b.active).map((b) => b.text),
    };
  } catch {
    return { heroHeadline: undefined, heroSubheadline: undefined, banners: [] };
  }
}

export default async function Home() {
  const { heroHeadline, heroSubheadline, banners } = await getSiteContent();

  return (
    <>
      <BannerStrip banners={banners} />
      <TickerTape />
      <Hero headline={heroHeadline} subheadline={heroSubheadline} />
      <MarketOverview />
      <AiAssistantPreview />
      <StakingProducts />
      <DepositCrypto />
      <NewsSection />
      <SecuritySection />
      <Testimonials />
      <DownloadApp />
      <Faq />
    </>
  );
}
