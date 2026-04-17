import { RefreshCw, DollarSign, Clock, AlertTriangle, CheckCircle, XCircle, HelpCircle, Mail } from "lucide-react";
import PolicyPageLayout, { InfoBox, WarningBox, SuccessBox, type PolicySection } from "@/components/legal/PolicyPageLayout";

const sections: PolicySection[] = [
  {
    id: "overview",
    title: "Refund Policy Overview",
    icon: <DollarSign className="w-4 h-4" />,
    content: (
      <>
        <p>At Verified BM Shop, we prioritize customer satisfaction. Due to the digital nature of our products, we operate a <strong>replacement-first policy</strong> rather than direct monetary refunds.</p>
        <InfoBox><DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>All eligible products come with a 7-day free replacement guarantee. If a product stops working within this period through no fault of your own, we will replace it at no additional cost.</span></InfoBox>
      </>
    ),
  },
  {
    id: "eligible",
    title: "Eligible for Replacement",
    icon: <CheckCircle className="w-4 h-4" />,
    content: (
      <>
        <p>You are eligible for a free replacement if:</p>
        <ul>
          <li>The product becomes inaccessible or non-functional within 7 days of delivery</li>
          <li>The issue is not caused by your actions (e.g., violating platform policies)</li>
          <li>You report the issue within the 7-day guarantee period</li>
          <li>You provide evidence of the issue (screenshot or error message)</li>
        </ul>
        <SuccessBox><CheckCircle className="w-5 h-5 text-[hsl(142,70%,45%)] shrink-0 mt-0.5" /><span>Replacement requests are typically processed within 1-4 hours after verification.</span></SuccessBox>
      </>
    ),
  },
  {
    id: "not-eligible",
    title: "Not Eligible for Refund",
    icon: <XCircle className="w-4 h-4" />,
    content: (
      <>
        <p>Refunds or replacements will NOT be provided in the following cases:</p>
        <ul>
          <li>The account was suspended due to your violation of platform advertising policies</li>
          <li>The issue is reported after the 7-day guarantee period has expired</li>
          <li>You shared account credentials with unauthorized third parties</li>
          <li>The product was used for prohibited or illegal activities</li>
          <li>You changed the account's verification information or security settings</li>
        </ul>
        <WarningBox><AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" /><span>Modifying verification documents or security settings on delivered accounts will void the replacement guarantee.</span></WarningBox>
      </>
    ),
  },
  {
    id: "process",
    title: "Replacement Process",
    icon: <RefreshCw className="w-4 h-4" />,
    content: (
      <>
        <p>To request a replacement, follow these steps:</p>
        <ol>
          <li><strong>Contact Support:</strong> Reach out via WhatsApp (+880 1302 669333) or Telegram (@Verifiedbmbuy) with your order details.</li>
          <li><strong>Provide Evidence:</strong> Share a screenshot or description of the issue you're experiencing.</li>
          <li><strong>Verification:</strong> Our team will verify the issue (usually within 30 minutes).</li>
          <li><strong>Replacement Delivery:</strong> A new product will be delivered within 1-4 hours after approval.</li>
        </ol>
      </>
    ),
  },
  {
    id: "timeline",
    title: "Timeline & Processing",
    icon: <Clock className="w-4 h-4" />,
    content: (
      <>
        <p>Our replacement timeline:</p>
        <ul>
          <li><strong>Guarantee Period:</strong> 7 days from the date of delivery</li>
          <li><strong>Verification Time:</strong> Up to 30 minutes</li>
          <li><strong>Replacement Delivery:</strong> 1-4 hours after approval</li>
          <li><strong>Support Availability:</strong> 24/7 via WhatsApp and Telegram</li>
        </ul>
      </>
    ),
  },
  {
    id: "exceptions",
    title: "Exceptional Refunds",
    icon: <HelpCircle className="w-4 h-4" />,
    content: (
      <>
        <p>In rare cases, a monetary refund may be considered if:</p>
        <ul>
          <li>We are unable to provide a suitable replacement</li>
          <li>The product was not delivered within the promised timeframe and you request cancellation before delivery</li>
          <li>A duplicate charge occurred due to a payment processing error</li>
        </ul>
        <p>Refund requests are reviewed on a case-by-case basis and processed within 3-5 business days.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact for Refunds",
    icon: <Mail className="w-4 h-4" />,
    content: (
      <>
        <p>For refund or replacement inquiries, contact us:</p>
        <ul>
          <li>WhatsApp: +880 1302 669333 (fastest)</li>
          <li>Telegram: @Verifiedbmbuy</li>
          <li>Email: info@verifiedbm.shop</li>
        </ul>
        <p>Please include your order ID and a description of the issue when contacting us.</p>
      </>
    ),
  },
];

const RefundPolicy = () => (
  <PolicyPageLayout
    title="Refund Policy"
    subtitle="RETURNS & REFUNDS"
    description="Our commitment to fair and transparent refund and replacement procedures."
    lastUpdated="February 15, 2026"
    sections={sections}
    breadcrumb="Refund Policy"
     seoTitle="Refund Policy - Verified BM Shop"
    seoDescription="Verified BM Shop' refund and replacement policy. Learn about our 7-day guarantee, eligible replacement criteria, and how to request a refund."
  />
);

export default RefundPolicy;
