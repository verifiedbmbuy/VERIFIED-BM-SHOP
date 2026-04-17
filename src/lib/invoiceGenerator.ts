import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { getSiteUrl } from "@/lib/config";
import { toBrandedUrl } from "@/lib/imageUtils";

interface OrderData {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  paid_at: string | null;
}

interface OrderItemData {
  product_title: string;
  unit_price: number;
  quantity: number;
}

interface StoreSettings {
  site_title: string;
  contact_email: string;
  whatsapp: string;
  address: string;
  tax_id: string;
  site_url: string;
  invoice_logo: string;
}

const fetchStoreSettings = async (): Promise<StoreSettings> => {
  const keys = ["site_title", "contact_email", "whatsapp", "store_address", "tax_id", "site_url", "invoice_logo"];
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", keys);

  const map: Record<string, string> = {};
  (data || []).forEach((r) => { map[r.key] = r.value; });

  return {
    site_title: map.site_title || "Verified BM Shop",
    contact_email: map.contact_email || "info@verifiedbm.shop",
    whatsapp: map.whatsapp || "",
    address: map.store_address || "Madergonj, Pirgonj, Rangpur, Bangladesh - 5470",
    tax_id: map.tax_id || "",
    site_url: map.site_url || getSiteUrl(),
    invoice_logo: map.invoice_logo || "",
  };
};

export const generateInvoicePDF = async (
  order: OrderData,
  items: OrderItemData[]
) => {
  const settings = await fetchStoreSettings();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor: [number, number, number] = [0, 122, 255]; // brand blue #007AFF
  const darkColor: [number, number, number] = [15, 23, 42];
  const mutedColor: [number, number, number] = [100, 116, 139];
  const lineColor: [number, number, number] = [226, 232, 240];

  let y = 20;

  // ──── Header ────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Try to load logo image — always resolve to branded/production URL
  let logoLoaded = false;
  const resolvedLogo = settings.invoice_logo ? toBrandedUrl(settings.invoice_logo) : "";
  if (resolvedLogo) {
    try {
      const img = await loadImage(resolvedLogo);
      // Flatten transparency onto the blue header background
      const flatDataUrl = flattenOnBackground(img, primaryColor);
      // Draw logo in header area (max 80x30)
      const ratio = Math.min(80 / img.width, 30 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      doc.addImage(flatDataUrl, "PNG", 15, y - 2, w, h);
      logoLoaded = true;
    } catch { /* fallback to text */ }
  }

  if (!logoLoaded) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(settings.site_title, 15, y + 8);
  }

  // INVOICE label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 15, y + 8, { align: "right" });

  // Contact line
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${settings.contact_email}  |  ${settings.whatsapp}`, 15, y + 18);
  doc.text(settings.address, 15, y + 23);

  y = 55;

  // ──── Invoice Meta ────
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Number:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(`INV-${order.id.slice(0, 8).toUpperCase()}`, 55, y);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", 15, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(order.created_at), "MMMM d, yyyy"), 55, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", 15, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(order.payment_method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), 55, y + 12);

  if (order.paid_at) {
    doc.setFont("helvetica", "bold");
    doc.text("Paid On:", 15, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(order.paid_at), "MMMM d, yyyy"), 55, y + 18);
  }

  // Status badge
  const statusX = pageWidth - 15;
  const statusText = order.status.toUpperCase();
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const isCompleted = order.status === "completed";
  doc.setTextColor(...(isCompleted ? [22, 163, 74] as [number, number, number] : primaryColor));
  doc.text(statusText, statusX, y, { align: "right" });

  y += 28;

  // ──── Bill To ────
  doc.setDrawColor(...lineColor);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 15, y);
  y += 7;

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(order.customer_name, 15, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text(order.customer_email, 15, y);

  if (settings.tax_id) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.text(`Tax ID: ${settings.tax_id}`, pageWidth - 15, y, { align: "right" });
  }

  y += 12;

  // ──── Items Table ────
  const tableData = items.map((item, i) => [
    (i + 1).toString(),
    item.product_title,
    item.quantity.toString(),
    `$${item.unit_price.toFixed(2)}`,
    `$${(item.unit_price * item.quantity).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Product", "Qty", "Unit Price", "Subtotal"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: darkColor,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 5,
    },
    bodyStyles: {
      textColor: darkColor,
      fontSize: 9,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // @ts-ignore - autoTable adds finalY
  y = (doc as any).lastAutoTable.finalY + 10;

  // ──── Totals ────
  const totalsX = pageWidth - 15;
  doc.setDrawColor(...lineColor);
  doc.line(pageWidth - 85, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Subtotal:", totalsX - 35, y);
  doc.setTextColor(...darkColor);
  doc.text(`$${order.total_amount.toFixed(2)}`, totalsX, y, { align: "right" });

  y += 6;
  doc.setTextColor(...mutedColor);
  doc.text("Tax:", totalsX - 35, y);
  doc.setTextColor(...darkColor);
  doc.text("$0.00", totalsX, y, { align: "right" });

  y += 6;
  doc.setTextColor(...mutedColor);
  doc.text("Shipping:", totalsX - 35, y);
  doc.setTextColor(...darkColor);
  doc.text("$0.00", totalsX, y, { align: "right" });

  y += 3;
  doc.setDrawColor(...lineColor);
  doc.line(pageWidth - 85, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("TOTAL:", totalsX - 55, y);
  doc.text(`$${order.total_amount.toFixed(2)} ${order.currency}`, totalsX, y, { align: "right" });

  // ──── Footer ────
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(...lineColor);
  doc.line(15, footerY, pageWidth - 15, footerY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Thank you for your business!", pageWidth / 2, footerY + 8, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...primaryColor);
  doc.textWithLink("https://verifiedbm.shop", pageWidth / 2 - doc.getTextWidth("https://verifiedbm.shop") / 2, footerY + 14, { url: "https://verifiedbm.shop" });
  doc.text(`${settings.site_title} · ${settings.address}`, pageWidth / 2, footerY + 19, { align: "center" });

  // ──── Save ────
  const dateStr = format(new Date(order.created_at), "yyyy-MM-dd");
  const shortId = order.id.slice(0, 8).toUpperCase();
  doc.save(`Invoice_${shortId}_${dateStr}.pdf`);
};

/** Load an image URL as an HTMLImageElement for jsPDF */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Flatten a potentially-transparent image onto a solid background color
 * so jsPDF (which ignores alpha) doesn't render transparency as black.
 */
const flattenOnBackground = (
  img: HTMLImageElement,
  bgColor: [number, number, number]
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d")!;
  // Fill with the header background color first
  ctx.fillStyle = `rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw logo on top — transparent pixels now show the bg color
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
};
