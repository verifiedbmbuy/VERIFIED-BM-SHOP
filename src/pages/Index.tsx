import { lazy, Suspense } from "react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import ProductsSection from "@/components/home/ProductsSection";

// Lazy-load below-the-fold sections
const BenefitsGrid = lazy(() => import("@/components/home/BenefitsGrid"));
const ServicesSection = lazy(() => import("@/components/home/ServicesSection"));
const WhyVBBStore = lazy(() => import("@/components/home/WhyVBBStore"));
const ScaleUpCTA = lazy(() => import("@/components/home/ScaleUpCTA"));
const TopAdvertisers = lazy(() => import("@/components/home/TopAdvertisers"));
const KeyAdvantages = lazy(() => import("@/components/home/KeyAdvantages"));

const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const AboutSection = lazy(() => import("@/components/home/AboutSection"));
const ContactMapSection = lazy(() => import("@/components/home/ContactMapSection"));
const BuyVerifiedBMGuide = lazy(() => import("@/components/home/BuyVerifiedBMGuide"));

const homeFaqs = [
  { question: "What exactly is a Verified Business Manager?", answer: "A Verified Business Manager is a Meta-approved account that has passed identity and business verification using legitimate company documents. It earns the highest trust level from Meta, unlocking premium advertising features, higher spend limits, and better ad delivery for your campaigns." },
  { question: "How fast will I get my account?", answer: "Most verified BM and WhatsApp API accounts are delivered within 1-4 hours after payment confirmation. Many are delivered within minutes, allowing you to start running Meta advertising campaigns the same day." },
  { question: "What payment methods do you accept?", answer: "We accept USDT (TRC20), Bitcoin (BTC), and Ethereum (ETH). Cryptocurrency payments ensure fast, secure, and private transactions for purchasing verified business solutions." },
  { question: "What if my account stops working?", answer: "We offer a 7-day free replacement guarantee on all verified BM and WhatsApp API accounts. If your account has any issues within 7 days that aren't caused by your actions, we'll replace it at no cost." },
  { question: "Is buying a verified BM safe?", answer: "Absolutely. Every Meta advertising asset we sell comes with genuine verification documents and is created through Meta's official verification process. Over 10,000 advertisers trust Verified BM Shop for their e-commerce scaling needs." },
  { question: "How does a Verified BM help with e-commerce scaling?", answer: "A verified Business Manager unlocks higher daily spend limits, better ad delivery through Meta's algorithm, access to premium targeting tools, and the ability to manage multiple ad accounts — all essential for scaling e-commerce advertising profitably." },
  { question: "Can I run ads in any country with a Verified BM?", answer: "Yes. Our verified Business Manager accounts have no geographic restrictions, allowing you to run Meta advertising campaigns targeting any country or region worldwide." },
];

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Buy Verified BM And WhatsApp API"
        description="Buy verified BM and WhatsApp Business API from Verified BM Shop. Instant delivery, 7-day replacement guarantee, 24/7 support. Trusted by 10,000+ advertisers worldwide."
        keywords="buy verified BM, verified business manager, WhatsApp Business API, Meta advertising assets, Facebook Business Manager, verified business solutions, e-commerce scaling"
      />
      <JsonLdSchema
        pageTitle="Buy Verified Business Manager & WhatsApp API | Verified BM Shop"
        pageDescription="Buy verified BM, WhatsApp API, Facebook Ads accounts from Verified BM Shop. Instant delivery, 7-day guarantee, 24/7 support. Trusted by 10,000+ advertisers."
        faqs={homeFaqs}
      />
      <HeroSection />
      <FeaturesSection />
      <ProductsSection />
      <Suspense fallback={null}>
        <BenefitsGrid type="bm" />
        <BenefitsGrid type="whatsapp" />
        <ServicesSection />
        <WhyVBBStore />
        <ScaleUpCTA />
        <TopAdvertisers />
        <KeyAdvantages />
        <TestimonialsSection />
        <FAQSection />
        <AboutSection />
        <ContactMapSection />
        <BuyVerifiedBMGuide />
      </Suspense>
    </Layout>
  );
};

export default Index;
