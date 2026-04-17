import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { customer_name, customer_email, payment_method_slug, items } = await req.json();

    // Validate customer name
    if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Customer name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (customer_name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Customer name must be under 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email
    if (!customer_email || typeof customer_email !== "string" || !isValidEmail(customer_email.trim())) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (customer_email.trim().length > 255) {
      return new Response(
        JSON.stringify({ error: "Email must be under 255 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one item is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each item has product_id and quantity
    for (const item of items) {
      if (!item.product_id || typeof item.product_id !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid product ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: "Invalid quantity for product" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate payment method exists and is active
    if (!payment_method_slug || typeof payment_method_slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Payment method is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("id, slug, type, is_active")
      .eq("slug", payment_method_slug)
      .eq("is_active", true)
      .single();

    if (!paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive payment method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (paymentMethod.type === "placeholder") {
      return new Response(
        JSON.stringify({ error: "This payment method is not available yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch actual product prices and verify stock
    const productIds = items.map((i: any) => i.product_id);
    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, title, price, sale_price, stock_quantity, stock_status")
      .in("id", productIds);

    if (productsErr || !products) {
      return new Response(
        JSON.stringify({ error: "Failed to verify products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify all products exist
    const productMap = new Map(products.map((p) => [p.id, p]));
    let serverTotal = 0;
    const verifiedItems: Array<{
      product_id: string;
      product_title: string;
      unit_price: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (product.stock_status === "out_of_stock" || product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for "${product.title}"` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const unitPrice = product.sale_price ?? product.price;
      serverTotal += unitPrice * item.quantity;
      verifiedItems.push({
        product_id: product.id,
        product_title: product.title,
        unit_price: unitPrice,
        quantity: item.quantity,
      });
    }

    // Create order with server-calculated total
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        payment_method: paymentMethod.slug,
        total_amount: serverTotal,
        status: "created",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("Order creation error:", orderErr);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert order items with verified prices
    const orderItems = verifiedItems.map((vi) => ({
      order_id: order.id,
      ...vi,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      console.error("Order items error:", itemsErr);
      // Clean up order on failure
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to create order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        total_amount: serverTotal,
        payment_type: paymentMethod.type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create order error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
