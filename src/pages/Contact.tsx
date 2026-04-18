import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import JsonLdSchema from "@/components/seo/JsonLdSchema";
import PageHeader from "@/components/layout/PageHeader";
import { MessageCircle, Send, Mail, Facebook, Users, Clock, Globe, Star, Headphones, Shield, Zap, RefreshCw, BadgeCheck, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePageSEO } from "@/hooks/usePageSEO";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { pageSEO } = usePageSEO("/contact-us");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert([form]);
    if (error) {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Message Sent!", description: "We'll get back to you as soon as possible." });
      setForm({ name: "", email: "", subject: "", message: "" });
    }
    setSubmitting(false);
  };

  const channels = [
    { icon: <MessageCircle className="w-6 h-6 text-[hsl(142,70%,45%)]" />, title: "WhatsApp", badge: "Fastest", desc: "Instant chat support", detail: "+880 1302 669333", href: "https://wa.me/8801302669333" },
    { icon: <Send className="w-6 h-6 text-[hsl(200,100%,40%)]" />, title: "Telegram", desc: "Message us anytime", detail: "@Verifiedbmbuy", href: "https://t.me/Verifiedbmbuy" },
     { icon: <Mail className="w-6 h-6 text-primary" />, title: "Email", desc: "For detailed inquiries", detail: "support@verifiedbm.shop", href: "mailto:support@verifiedbm.shop" },
    { icon: <Facebook className="w-6 h-6 text-primary" />, title: "Messenger", desc: "Facebook Messenger", detail: "Verified BM Shop", href: "https://m.me/101736778209833" },
  ];

  const trustReasons = [
    { icon: <Headphones className="w-6 h-6 text-primary" />, title: "24/7 Live Support", desc: "Our team is always online — reach us anytime via WhatsApp, Telegram, or email for instant help." },
    { icon: <Shield className="w-6 h-6 text-primary" />, title: "Secure Transactions", desc: "Every transaction is encrypted and secure. We never store sensitive credentials after delivery." },
    { icon: <Zap className="w-6 h-6 text-primary" />, title: "Lightning-Fast Delivery", desc: "Most orders are delivered within 1–4 hours. We prioritize speed without compromising quality." },
    { icon: <RefreshCw className="w-6 h-6 text-primary" />, title: "7-Day Replacement", desc: "All products come with a 7-day free replacement guarantee. No questions asked." },
    { icon: <BadgeCheck className="w-6 h-6 text-primary" />, title: "Verified Products Only", desc: "We only sell fully verified, compliant accounts that are ready to use immediately." },
    { icon: <Globe className="w-6 h-6 text-primary" />, title: "Global Coverage", desc: "Serving customers in 50+ countries worldwide with localized support and guidance." },
  ];

  const steps = [
    { num: "1", title: "Reach Out", desc: "Contact us via WhatsApp, Telegram, or the form above." },
    { num: "2", title: "Get Assisted", desc: "Our team will respond within minutes with a solution." },
    { num: "3", title: "Issue Resolved", desc: "We work until your question or issue is fully resolved." },
    { num: "4", title: "Happy Customer", desc: "Join 5,000+ satisfied customers worldwide." },
  ];

  const faqs = [
    { q: "How fast will I get a response?", a: "WhatsApp and Telegram messages are typically answered within 2 minutes. Email responses take up to 2 hours." },
    { q: "What if I have an issue with my order?", a: "Contact us immediately via WhatsApp or Telegram. We offer a 7-day replacement guarantee on all products." },
    { q: "Do you offer pre-purchase consultations?", a: "Absolutely! Message us on WhatsApp or Telegram and we'll help you choose the right product for your needs." },
    { q: "What payment methods do you accept?", a: "We accept USDT (TRC20), Bitcoin (BTC), and Ethereum (ETH). Crypto ensures fast, secure transactions." },
    { q: "Can I get a refund?", a: "We offer replacements rather than refunds. If your product has any issues within 7 days, we'll replace it free of charge." },
    { q: "Do you provide setup assistance?", a: "Yes! Every purchase includes a setup guide, and our team is available 24/7 to walk you through the process." },
  ];

  return (
    <Layout>
       <SEOHead title={pageSEO?.meta_title || pageSEO?.title || "Contact Us - 24/7 Support"} description={pageSEO?.meta_description || "Get in touch with Verified BM Shop 24/7 via WhatsApp, Telegram, or email. Average response time under 2 minutes. Serving 50+ countries worldwide."} />
      <JsonLdSchema
        pageTitle={pageSEO?.meta_title || pageSEO?.title || "Contact Us - 24/7 Support"}
        pageDescription={pageSEO?.meta_description || "Get in touch with Verified BM Shop 24/7 via WhatsApp, Telegram, or email."}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]}
        faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <PageHeader
        breadcrumb="Contact Us"
        subtitle="24/7 SUPPORT"
        title={pageSEO?.title || "Get in Touch"}
        description={pageSEO?.meta_description || "We're here to help 24/7. Reach out through any of our channels."}
      />

      {/* Stats */}
      <section className="border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Users className="w-6 h-6 text-primary" />, value: "5,000+", label: "Happy Customers" },
              { icon: <Clock className="w-6 h-6 text-primary" />, value: "< 2 min", label: "Avg. Response Time" },
              { icon: <Globe className="w-6 h-6 text-primary" />, value: "50+", label: "Countries Served" },
              { icon: <Star className="w-6 h-6 text-primary" />, value: "4.9/5", label: "Support Rating" },
            ].map((s, i) => (
              <div key={i}>
                <div className="flex justify-center mb-2">{s.icon}</div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels + Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Reach Us</p>
          <h2 className="text-3xl font-bold text-foreground text-center mt-2">Choose Your Preferred Channel</h2>
          <p className="text-muted-foreground text-center mt-2">We respond fastest on WhatsApp and Telegram — usually within minutes.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
            <div className="space-y-4">
              {channels.map((c, i) => (
                <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">{c.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{c.title}</span>
                      {c.badge && <span className="text-[10px] font-bold bg-[hsl(142,70%,45%)] text-primary-foreground px-2 py-0.5 rounded uppercase">{c.badge}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                    <p className="text-xs text-foreground font-medium">{c.detail}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </a>
              ))}

              <div className="bg-card border border-border rounded-lg p-4 mt-4">
                <h4 className="font-bold text-foreground">Store Address</h4>
                <p className="text-sm text-muted-foreground">Verified BM Shop, Madergonj, Pirgonj, Rangpur, Bangladesh - 5470</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-bold text-foreground">Support Hours</h4>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <div className="flex justify-between"><span>WhatsApp & Telegram</span><span className="font-medium text-foreground">24/7</span></div>
                  <div className="flex justify-between"><span>Email Response</span><span className="font-medium text-foreground">Within 2 hours</span></div>
                  <div className="flex justify-between"><span>Order Processing</span><span className="font-medium text-foreground">1–4 hours</span></div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold text-foreground">Send Us a Message</h3>
              <p className="text-sm text-muted-foreground mt-1">Fill out the form and we'll get back to you as soon as possible.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Message *</label>
                  <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submitting ? "Sending..." : "Send Message"}
                </button>
                <p className="text-xs text-muted-foreground text-center">We typically respond within 30 minutes during business hours.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Why Us</p>
          <h2 className="text-3xl font-bold text-foreground text-center mt-2">Why Customers Trust Verified BM Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {trustReasons.map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">{r.icon}</div>
                <h3 className="font-bold text-foreground">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">Process</p>
          <h2 className="text-3xl font-bold text-foreground text-center mt-2">How Getting Support Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">{s.num}</div>
                <h3 className="font-bold text-foreground mt-4">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary text-center">FAQ</p>
          <h2 className="text-3xl font-bold text-foreground text-center mt-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-center mt-2">Quick answers to common questions about our support and services.</p>
          <div className="max-w-3xl mx-auto mt-10">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold text-foreground">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="text-muted-foreground mt-4">Browse our verified products or chat with our team to find the perfect solution for your business.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <a href="https://wa.me/8801302669333" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[hsl(142,70%,45%)] text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              <MessageCircle className="w-5 h-5" /> WhatsApp Us Now
            </a>
            <a href="https://t.me/Verifiedbmbuy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[hsl(200,100%,40%)] text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              <Send className="w-5 h-5" /> Chat on Telegram
            </a>
            <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
