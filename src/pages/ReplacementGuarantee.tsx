import { Shield, CheckCircle, Clock, Zap, Headphones, Award, MessageCircle, Send } from "lucide-react";
import PolicyPageLayout, { SuccessBox, InfoBox, type PolicySection } from "@/components/legal/PolicyPageLayout";
import { Link } from "react-router-dom";

const sections: PolicySection[] = [
  {
    id: "guarantee",
    title: "Our 7-Day Guarantee",
    icon: <Shield className="w-4 h-4" />,
    content: (
      <>
        <p>Every product purchased from Verified BM Shop comes with our industry-leading <strong>7-Day Free Replacement Guarantee</strong>. If your account stops working within 7 days of delivery — through no fault of your own — we will replace it completely free of charge.</p>
        <SuccessBox><Shield className="w-5 h-5 text-[hsl(142,70%,45%)] shrink-0 mt-0.5" /><span><strong>Zero Risk Purchase.</strong> We stand behind every product we sell. Your satisfaction is our top priority, and our guarantee reflects our confidence in the quality of our accounts.</span></SuccessBox>
      </>
    ),
  },
  {
    id: "covered",
    title: "What's Covered",
    icon: <CheckCircle className="w-4 h-4" />,
    content: (
      <>
        <p>The replacement guarantee covers the following scenarios:</p>
        <ul>
          <li>Account becomes inaccessible or locked without your action</li>
          <li>Verification is revoked by the platform for pre-existing reasons</li>
          <li>Account functionality does not match the product description</li>
          <li>Delivery credentials are incorrect or non-functional</li>
          <li>Business Manager ad account limits don't match the purchased tier</li>
        </ul>
      </>
    ),
  },
  {
    id: "not-covered",
    title: "What's Not Covered",
    icon: <Award className="w-4 h-4" />,
    content: (
      <>
        <p>The guarantee does not cover issues caused by:</p>
        <ul>
          <li>Running ads that violate Meta, Google, or TikTok policies</li>
          <li>Changing verification documents or security settings</li>
          <li>Sharing credentials with unauthorized users</li>
          <li>Using the account for prohibited or illegal activities</li>
          <li>Issues reported after the 7-day guarantee period</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-it-works",
    title: "How It Works",
    icon: <Zap className="w-4 h-4" />,
    content: (
      <>
        <p>Claiming your replacement is simple and fast:</p>
        <ol>
          <li><strong>Step 1:</strong> Contact us via WhatsApp or Telegram within 7 days of delivery</li>
          <li><strong>Step 2:</strong> Share your order ID and a screenshot of the issue</li>
          <li><strong>Step 3:</strong> Our team verifies the issue (typically within 30 minutes)</li>
          <li><strong>Step 4:</strong> A replacement is delivered within 1-4 hours</li>
        </ol>
        <InfoBox><Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>Most replacement claims are resolved within 2 hours from initial contact.</span></InfoBox>
      </>
    ),
  },
  {
    id: "response-time",
    title: "Response Times",
    icon: <Clock className="w-4 h-4" />,
    content: (
      <>
        <ul>
          <li><strong>WhatsApp/Telegram:</strong> Response within 2-5 minutes, 24/7</li>
          <li><strong>Verification:</strong> 15-30 minutes</li>
          <li><strong>Replacement Delivery:</strong> 1-4 hours after approval</li>
          <li><strong>Email:</strong> Response within 2 hours</li>
        </ul>
      </>
    ),
  },
  {
    id: "support",
    title: "24/7 Support",
    icon: <Headphones className="w-4 h-4" />,
    content: (
      <>
        <p>Our support team is available around the clock to help with replacement claims:</p>
        <ul>
          <li>WhatsApp: +880 1302 669333</li>
          <li>Telegram: @Verifiedbmbuy</li>
          <li>Email: info@verifiedbm.shop</li>
        </ul>
        <div className="flex flex-wrap gap-3 mt-4 not-prose">
          <a href="https://wa.me/8801302669333" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[hsl(142,70%,45%)] !text-white text-sm font-medium no-underline hover:opacity-90 transition-opacity">
            <MessageCircle className="w-4 h-4 text-white" /> <span className="text-white">Chat on WhatsApp</span>
          </a>
          <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[hsl(200,100%,40%)] !text-white text-sm font-medium no-underline hover:opacity-90 transition-opacity">
            <Send className="w-4 h-4 text-white" /> <span className="text-white">Message on Telegram</span>
          </a>
        </div>
      </>
    ),
  },
];

const ReplacementGuarantee = () => (
  <PolicyPageLayout
    title="7-Day Replacement Guarantee"
    subtitle="OUR PROMISE"
    description="Zero-risk purchasing with our industry-leading replacement guarantee."
    lastUpdated="February 15, 2026"
    sections={sections}
    breadcrumb="Replacement Guarantee"
    seoTitle="7-Day Replacement Guarantee - Verified BM Shop"
    seoDescription="Verified BM Shop offers a 7-day free replacement guarantee on all products. Learn how our guarantee works and how to claim a replacement."
  />
);

export default ReplacementGuarantee;
