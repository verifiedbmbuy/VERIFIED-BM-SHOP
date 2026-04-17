import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Plug, ExternalLink, CheckCircle, XCircle, Settings2, X, Globe, MessageSquare, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof Globe;
  color: string;
  connected: boolean;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "meta",
    name: "Meta Graph API",
    description: "Connect to Facebook & Instagram APIs for ad account management and business verification.",
    icon: Globe,
    color: "bg-blue-500/10 text-blue-500",
    connected: false,
    fields: [
      { key: "app_id", label: "App ID", placeholder: "123456789012345" },
      { key: "app_secret", label: "App Secret", placeholder: "••••••••••••••••", type: "password" },
      { key: "access_token", label: "Access Token", placeholder: "EAABsbCS1iHgBAO...", type: "password" },
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://verifiedbm.shop/api/meta/webhook" },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    description: "Automate messaging, manage templates, and handle customer communications at scale.",
    icon: MessageSquare,
    color: "bg-green-500/10 text-green-500",
    connected: false,
    fields: [
      { key: "phone_id", label: "Phone Number ID", placeholder: "109876543210" },
      { key: "business_id", label: "Business Account ID", placeholder: "567890123456" },
      { key: "api_token", label: "API Token", placeholder: "••••••••••••••••", type: "password" },
      { key: "webhook_url", label: "Webhook Verify Token", placeholder: "my_verify_token" },
    ],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Sync products, orders, and inventory with your WooCommerce store in real-time.",
    icon: ShoppingCart,
    color: "bg-purple-500/10 text-purple-500",
    connected: false,
    fields: [
      { key: "store_url", label: "Store URL", placeholder: "https://store.example.com" },
      { key: "consumer_key", label: "Consumer Key", placeholder: "ck_••••••••••••", type: "password" },
      { key: "consumer_secret", label: "Consumer Secret", placeholder: "cs_••••••••••••", type: "password" },
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://verifiedbm.shop/api/woo/webhook" },
    ],
  },
];

const AdminIntegrations = () => {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const openConfig = (integration: Integration) => {
    setConfiguring(integration);
    setFieldValues({});
  };

  const handleConnect = () => {
    if (!configuring) return;
    setIntegrations((prev) =>
      prev.map((i) => (i.id === configuring.id ? { ...i, connected: true } : i))
    );
    toast({
      title: "Integration Connected",
      description: `${configuring.name} has been configured successfully.`,
    });
    setConfiguring(null);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: false } : i))
    );
    toast({ title: "Integration Disconnected" });
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Integrations — Admin</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Plug className="w-6 h-6 text-[#2271b1]" /> Integrations Hub
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect external services and APIs to extend your platform capabilities.</p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {integrations.map((integration, i) => (
          <div
            key={integration.id}
            className={cn(
              "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5",
              animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", integration.color)}>
                <integration.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                integration.connected
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              )}>
                {integration.connected ? (
                  <><CheckCircle className="w-3 h-3" /> Connected</>
                ) : (
                  <><XCircle className="w-3 h-3" /> Disconnected</>
                )}
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{integration.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{integration.description}</p>

            <div className="flex gap-2 mt-5">
              <Button
                size="sm"
                className={cn(
                  "gap-1.5 text-xs flex-1",
                  integration.connected
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-[#2271b1] hover:bg-[#135e96] text-white"
                )}
                onClick={() => openConfig(integration)}
              >
                <Settings2 className="w-3.5 h-3.5" />
                {integration.connected ? "Reconfigure" : "Configure"}
              </Button>
              {integration.connected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDisconnect(integration.id)}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* API Documentation Links */}
      <div
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-500",
          animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
        style={{ transitionDelay: "400ms" }}
      >
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">API Documentation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "Meta Graph API Docs", url: "https://developers.facebook.com/docs/graph-api/" },
            { name: "WhatsApp Business API", url: "https://developers.facebook.com/docs/whatsapp/" },
            { name: "WooCommerce REST API", url: "https://woocommerce.github.io/woocommerce-rest-api-docs/" },
          ].map((doc) => (
            <a
              key={doc.name}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm text-[#2271b1] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {doc.name}
            </a>
          ))}
        </div>
      </div>

      {/* Configure Modal */}
      <Dialog open={!!configuring} onOpenChange={() => setConfiguring(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {configuring && (
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", configuring.color)}>
                  <configuring.icon className="w-4 h-4" />
                </div>
              )}
              Configure {configuring?.name}
            </DialogTitle>
          </DialogHeader>
          {configuring && (
            <div className="space-y-4 mt-2">
              {configuring.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    value={fieldValues[field.key] || ""}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="text-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setConfiguring(null)}>Cancel</Button>
                <Button size="sm" className="bg-[#2271b1] hover:bg-[#135e96]" onClick={handleConnect}>
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Connect
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminIntegrations;
