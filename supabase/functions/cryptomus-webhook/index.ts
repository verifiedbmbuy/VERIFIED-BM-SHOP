import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get API key from settings
    const { data: apiKeyRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "cryptomus_api_key")
      .single();

    const apiKey = apiKeyRow?.value;
    if (!apiKey) {
      return new Response("Not configured", { status: 400 });
    }

    const body = await req.json();

    // Verify signature
    const { sign: receivedSign, ...payload } = body;
    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = base64Encode(new TextEncoder().encode(payloadJson));
    const signData = new TextEncoder().encode(payloadBase64 + apiKey);
    const hashBuffer = await crypto.subtle.digest("MD5", signData);
    const expectedSign = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (receivedSign !== expectedSign) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 403 });
    }

    const orderId = body.order_id;
    const status = body.status;

    // Cryptomus statuses: paid, paid_over, confirm_check, wrong_amount, etc.
    if (status === "paid" || status === "paid_over") {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single();

      if (order && order.status !== "completed") {
        await supabase
          .from("orders")
          .update({ status: "completed", paid_at: new Date().toISOString() })
          .eq("id", orderId);

        // Reduce stock
        const { data: items } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (items) {
          for (const item of items) {
            const { data: product } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();

            if (product) {
              const newQty = Math.max(0, product.stock_quantity - item.quantity);
              await supabase
                .from("products")
                .update({
                  stock_quantity: newQty,
                  stock_status: newQty === 0 ? "out_of_stock" : "in_stock",
                })
                .eq("id", item.product_id);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});
