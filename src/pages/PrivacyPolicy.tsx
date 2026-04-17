import { Shield, Eye, Database, Lock, Cookie, UserCheck, Globe, Mail } from "lucide-react";
import PolicyPageLayout, { InfoBox, type PolicySection } from "@/components/legal/PolicyPageLayout";

const sections: PolicySection[] = [
  {
    id: "overview",
    title: "Overview",
    icon: <Shield className="w-4 h-4" />,
    content: (
      <>
        <p>Verified BM Shop ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and purchase our products.</p>
        <InfoBox><Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>We never sell, trade, or rent your personal data to third parties. Your information is only used to process orders and provide customer support.</span></InfoBox>
      </>
    ),
  },
  {
    id: "data-collection",
    title: "Information We Collect",
    icon: <Database className="w-4 h-4" />,
    content: (
      <>
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>Personal Information:</strong> Name, email address, and contact details you provide when placing an order or contacting support.</li>
          <li><strong>Transaction Data:</strong> Payment method used, order amount, and cryptocurrency wallet addresses for payment processing.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, operating system, and browsing patterns collected automatically through cookies and analytics tools.</li>
          <li><strong>Communication Data:</strong> Messages sent through our contact form, WhatsApp, Telegram, or email.</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-use",
    title: "How We Use Your Data",
    icon: <Eye className="w-4 h-4" />,
    content: (
      <>
        <p>Your information is used for the following purposes:</p>
        <ul>
          <li>Processing and fulfilling your orders</li>
          <li>Providing customer support and responding to inquiries</li>
          <li>Sending order confirmations and delivery updates</li>
          <li>Improving our website, products, and services</li>
          <li>Preventing fraud and unauthorized transactions</li>
          <li>Sending promotional communications (only with your consent)</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-security",
    title: "Data Security",
    icon: <Lock className="w-4 h-4" />,
    content: (
      <>
        <p>We implement industry-standard security measures to protect your personal information, including:</p>
        <ul>
          <li>SSL/TLS encryption for all data transmission</li>
          <li>Encrypted database storage for sensitive information</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access controls limiting data access to authorized personnel only</li>
        </ul>
        <p>While we strive to protect your data, no method of electronic storage or transmission is 100% secure. We encourage you to use strong passwords and exercise caution online.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    icon: <Cookie className="w-4 h-4" />,
    content: (
      <>
        <p>We use cookies and similar tracking technologies to enhance your browsing experience. These include:</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., cart, session management).</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website to improve performance.</li>
          <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (only with your consent).</li>
        </ul>
        <p>You can control cookie preferences through your browser settings. Disabling certain cookies may affect website functionality.</p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights",
    icon: <UserCheck className="w-4 h-4" />,
    content: (
      <>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal obligations).</li>
          <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
          <li><strong>Data Portability:</strong> Request your data in a commonly used, machine-readable format.</li>
        </ul>
        <p>To exercise any of these rights, contact us using the details below.</p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Third-Party Services",
    icon: <Globe className="w-4 h-4" />,
    content: (
      <>
        <p>We may use third-party services for analytics, payment processing, and communication. These services have their own privacy policies and we encourage you to review them:</p>
        <ul>
          <li>Google Analytics — website traffic analysis</li>
          <li>Cryptomus — cryptocurrency payment processing</li>
          <li>WhatsApp / Telegram — customer communication</li>
        </ul>
        <p>We do not share your data with third parties for marketing purposes without your explicit consent.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact Us",
    icon: <Mail className="w-4 h-4" />,
    content: (
      <>
        <p>If you have questions about this Privacy Policy, contact our Data Protection team:</p>
        <ul>
          <li>WhatsApp: +880 1302 669333</li>
          <li>Telegram: @Verifiedbmbuy</li>
          <li>Email: info@verifiedbm.shop</li>
          <li>Address: Verified BM Shop, Madergonj, Pirgonj, Rangpur, Bangladesh - 5470</li>
        </ul>
      </>
    ),
  },
];

const PrivacyPolicy = () => (
  <PolicyPageLayout
    title="Privacy Policy"
    subtitle="YOUR PRIVACY MATTERS"
    description="How we collect, use, and protect your personal information."
    lastUpdated="February 15, 2026"
    sections={sections}
    breadcrumb="Privacy Policy"
     seoTitle="Privacy Policy - Verified BM Shop"
    seoDescription="Learn how Verified BM Shop collects, uses, and protects your personal data. We are committed to transparency and data security."
  />
);

export default PrivacyPolicy;
