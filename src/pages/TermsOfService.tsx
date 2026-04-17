import { FileText, Scale, ShieldCheck, CreditCard, Ban, AlertTriangle, Globe, Mail } from "lucide-react";
import PolicyPageLayout, { InfoBox, WarningBox, type PolicySection } from "@/components/legal/PolicyPageLayout";

const sections: PolicySection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    icon: <FileText className="w-4 h-4" />,
    content: (
      <>
        <p>By accessing and using Verified BM Shop ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.</p>
        <p>These terms apply to all visitors, users, and others who access or use our services, including the purchase of verified Business Manager accounts, WhatsApp Business API accounts, and related digital advertising products.</p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    icon: <ShieldCheck className="w-4 h-4" />,
    content: (
      <>
        <p>You must be at least 18 years old and have the legal capacity to enter into a binding agreement. By using our services, you represent and warrant that you meet these requirements.</p>
        <InfoBox><ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>All purchases must be made for lawful business purposes in compliance with Meta's advertising policies and applicable laws in your jurisdiction.</span></InfoBox>
      </>
    ),
  },
  {
    id: "products",
    title: "Products & Services",
    icon: <Globe className="w-4 h-4" />,
    content: (
      <>
        <p>Verified BM Shop provides verified digital advertising accounts, including but not limited to:</p>
        <ul>
          <li>Verified Facebook Business Managers (BM 1, BM 3, BM 5, BM 10)</li>
          <li>WhatsApp Business API accounts</li>
          <li>Facebook Ads accounts</li>
          <li>TikTok Agency Ad accounts</li>
          <li>Google Ads accounts</li>
          <li>Reinstated Facebook profiles</li>
        </ul>
        <p>All products are delivered digitally and come with genuine verification documentation.</p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment Terms",
    icon: <CreditCard className="w-4 h-4" />,
    content: (
      <>
        <p>All prices are listed in USD. We accept the following payment methods:</p>
        <ul>
          <li>USDT (TRC20)</li>
          <li>Bitcoin (BTC)</li>
          <li>Ethereum (ETH)</li>
        </ul>
        <p>Payment must be completed in full before product delivery. All sales are final once the product has been delivered and accessed by the buyer.</p>
        <WarningBox><AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" /><span>Chargebacks or fraudulent payment claims will result in immediate account termination and may be reported to relevant authorities.</span></WarningBox>
      </>
    ),
  },
  {
    id: "usage",
    title: "Acceptable Use",
    icon: <Scale className="w-4 h-4" />,
    content: (
      <>
        <p>You agree to use all products in compliance with Meta's, Google's, and TikTok's advertising policies. Prohibited activities include:</p>
        <ul>
          <li>Using accounts for illegal advertising or scams</li>
          <li>Reselling accounts without authorization</li>
          <li>Attempting to reverse-engineer or tamper with verification</li>
          <li>Sharing account credentials with unauthorized third parties</li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibited",
    title: "Prohibited Activities",
    icon: <Ban className="w-4 h-4" />,
    content: (
      <>
        <p>The following activities are strictly prohibited and may result in account suspension without refund:</p>
        <ul>
          <li>Running ads that violate platform advertising policies</li>
          <li>Using accounts for phishing, malware distribution, or fraud</li>
          <li>Misrepresenting the origin or documentation of purchased accounts</li>
          <li>Attempting to hack, exploit, or disrupt our services</li>
        </ul>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    icon: <AlertTriangle className="w-4 h-4" />,
    content: (
      <>
        <p>Verified BM Shop shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services. Our total liability for any claim arising from these terms shall not exceed the amount paid by you for the specific product in question.</p>
        <p>We are not responsible for actions taken by Meta, Google, TikTok, or any third-party platform against accounts after delivery.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact Information",
    icon: <Mail className="w-4 h-4" />,
    content: (
      <>
        <p>For questions regarding these Terms of Service, contact us at:</p>
        <ul>
          <li>WhatsApp: +880 1302 669333</li>
          <li>Telegram: @Verifiedbmbuy</li>
          <li>Email: info@verifiedbm.shop</li>
        </ul>
      </>
    ),
  },
];

const TermsOfService = () => (
  <PolicyPageLayout
    title="Terms of Service"
    subtitle="LEGAL"
    description="Please read these terms carefully before using our services."
    lastUpdated="February 15, 2026"
    sections={sections}
    breadcrumb="Terms of Service"
     seoTitle="Terms of Service - Verified BM Shop"
    seoDescription="Read Verified BM Shop' Terms of Service covering purchases, usage policies, payment terms, and liability for verified digital advertising accounts."
  />
);

export default TermsOfService;
