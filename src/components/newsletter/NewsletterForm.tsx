import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address.").max(255);

const NewsletterForm = ({ variant = "footer" }: { variant?: "footer" | "modal" }) => {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (honeypot) return;

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    // Use upsert to handle duplicates without needing SELECT access
    const { error, status } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: result.data, status: "subscribed" },
        { onConflict: "email" }
      );

    if (error) {
      if (error.code === "23505") {
        toast.info("You are already on the list!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } else {
      setSuccess(true);
    }
    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className={`flex items-center gap-2 ${variant === "footer" ? "text-primary-foreground" : "text-foreground"}`}>
        <CheckCircle className="w-5 h-5 text-[hsl(142,70%,45%)]" />
        <span className="text-sm font-medium">Success! Check your inbox.</span>
      </div>
    );
  }

  const isFooter = variant === "footer";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot - hidden from users, visible to bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
      />
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className={isFooter
            ? "bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            : ""
          }
        />
        <Button type="submit" disabled={submitting} className="gap-1.5 shrink-0">
          <Mail className="w-4 h-4" />
          {submitting ? "…" : "Subscribe"}
        </Button>
      </div>
      <p className={`text-xs ${isFooter ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
};

export default NewsletterForm;
