import { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const NewsletterPopup = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show when triggered after a successful order
    const shouldShow = sessionStorage.getItem("newsletter_show_after_order");
    if (!shouldShow) return;
    if (sessionStorage.getItem("newsletter_dismissed")) return;

    sessionStorage.removeItem("newsletter_show_after_order");
    setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("newsletter_dismissed", "true");
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/50 animate-in fade-in" onClick={dismiss} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-background rounded-xl border border-border shadow-2xl p-6 animate-in zoom-in-95 fade-in">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Stay in the Loop</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Get exclusive deals, tips, and updates delivered to your inbox.
          </p>
        </div>

        <NewsletterForm variant="modal" />
      </div>
    </>
  );
};

export default NewsletterPopup;
