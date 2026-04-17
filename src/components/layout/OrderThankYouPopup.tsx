import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "vbb_order_completed";

export const triggerOrderThankYou = () => {
  localStorage.setItem(STORAGE_KEY, "true");
  sessionStorage.setItem("newsletter_show_after_order", "true");
  window.dispatchEvent(new Event("order-completed"));
};

const OrderThankYouPopup = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        setVisible(true);
      }
    };

    // Check on mount
    show();

    // Listen for new order events
    window.addEventListener("order-completed", show);
    return () => window.removeEventListener("order-completed", show);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-4 z-50 max-w-xs rounded-xl border border-border bg-background shadow-lg p-4 flex items-start gap-3"
        >
          <div className="shrink-0 rounded-full bg-primary/10 p-2">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Your Order Is Successfully Placed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Thank you for your order!</p>
          </div>
          <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderThankYouPopup;
