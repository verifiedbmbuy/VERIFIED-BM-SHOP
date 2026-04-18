import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "What exactly is a Verified Business Manager?", a: "A Verified Business Manager is a Meta-approved account that has passed identity and business verification using legitimate company documents. It earns the highest trust level from Meta, unlocking premium advertising features, higher spend limits, and better ad delivery." },
  { q: "How does the Meta verification process work?", a: "Meta verifies the business identity using real company registration documents, tax IDs, and other official paperwork. Our verified BM accounts have already completed this process, so you get a fully verified Meta advertising asset ready to use immediately." },
  { q: "What's the WhatsApp Business API?", a: "The WhatsApp Business API is an enterprise-level messaging platform that allows businesses to send bulk messages, set up AI chatbots, integrate with CRM systems, and manage customer communications at scale — all with end-to-end encryption." },
  { q: "How fast will I get my verified BM account?", a: "Most verified BM and WhatsApp API accounts are delivered within 1-4 hours after payment confirmation. Many are delivered within minutes, so you can start your Meta advertising campaigns the same day." },
  { q: "What payment methods do you accept?", a: "We accept USDT (TRC20), Bitcoin (BTC), and Ethereum (ETH). Cryptocurrency payments ensure fast, secure, and private transactions for purchasing verified business solutions." },
  { q: "What if my account stops working?", a: "We offer a 7-day free replacement guarantee on all verified BM accounts. If your account has any issues within 7 days of purchase (that aren't caused by your actions), we'll replace it at no cost — no questions asked." },
  { q: "Can I use a verified BM for any advertising niche?", a: "Yes, verified BMs work for all advertising niches supported by Meta's advertising policies. However, you must comply with Meta's advertising guidelines and community standards." },
  { q: "How many ad accounts can I run from one verified BM?", a: "The number of ad accounts depends on the BM tier you purchase. BM 1 supports 1 ad account, BM 3 supports 3, BM 5 supports 5, and BM 10 supports 10 ad accounts — ideal for e-commerce scaling." },
  { q: "Is buying a verified BM safe and legitimate?", a: "Absolutely. Every Meta advertising asset we sell comes with genuine verification documents and is created through Meta's official verification process. We've served over 10,000 customers with a stellar track record since 2019." },
  { q: "Do you offer bulk pricing for agencies?", a: "Yes! We offer volume discounts for agencies and resellers ordering 10 or more verified accounts. Contact us on WhatsApp or Telegram for custom bulk pricing on verified business solutions." },
  { q: "Do you sell TikTok and Google Ads accounts?", a: "Yes, we offer verified TikTok Agency Ad Accounts and Google Ads accounts, ready to use with high spending limits and faster approvals for cross-platform advertising." },
  { q: "Can I get a reinstated Facebook profile?", a: "Yes, we offer reinstated Facebook profiles with clean records and full functionality. These are recovered profiles that have been restored to good standing with Meta." },
  { q: "How do I reach support after purchasing?", a: "Our support team is available 24/7 via WhatsApp (+880 1302 669333), Telegram (@Verifiedbmbuy), and email (info@verifiedbm.shop). We typically respond within minutes." },
  { q: "What trust score do your verified BMs have?", a: "Our verified BMs carry Meta's highest trust score (99.9%), which means fewer bans, better ad delivery algorithms, and higher daily spend limits for your campaigns." },
  { q: "Can I start running ads immediately after purchase?", a: "Yes! All our verified BM accounts come ready to use. Simply log in, set up your payment method, create your ad campaign, and start advertising right away — no warm-up period needed." },
  { q: "Do your WhatsApp API accounts get the green badge?", a: "Yes, our WhatsApp Business API accounts are eligible for the official green checkmark verification badge, which builds trust with your customers and improves message open rates." },
  { q: "What happens if my account gets restricted?", a: "If your account gets restricted within the 7-day guarantee period due to no fault of your own, we'll replace it for free. Our team can also help troubleshoot restriction issues and provide guidance." },
  { q: "Can I use the verified BM from any country?", a: "Yes, our verified accounts work globally with no geographic restrictions. You can run Meta advertising campaigns targeting any country or region worldwide." },
  { q: "Do accounts come with verification documentation?", a: "Every verified BM account comes with complete documentation including business registration, tax information, and all paperwork used in the Meta verification process." },
  { q: "How long has Verified BM Shop been operating?", a: "Verified BM Shop has been operating since 2019, with over 5 years of experience serving more than 10,000 customers across 50+ countries with reliable verified business solutions." },
];

const FAQSection = () => (
  <section className="py-16 bg-background" aria-label="Frequently asked questions about verified BM accounts">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">FAQ</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mt-2">Frequently Asked Questions</h2>
      <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
        Everything advertisers ask before buying <strong>verified Business Manager</strong> accounts and <strong>WhatsApp Business API</strong>.
      </p>

      <Accordion type="single" collapsible className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 items-start gap-x-6 gap-y-0.5">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold text-foreground py-2 text-sm">
              <span className="truncate block">{faq.q}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm pb-2">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
