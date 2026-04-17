import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// This function should be called periodically (e.g. via cron or manual trigger)
// to time out manual orders that haven't uploaded proof within 30 minutes.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a shared secret for cron/admin access
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: timedOut, error } = await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("payment_method", "binance")
      .in("status", ["created", "processing"])
      .is("proof_image_url", null)
      .lt("created_at", thirtyMinAgo)
      .select("id");

    console.log(`Timed out ${timedOut?.length || 0} orders`, error);

    return new Response(
      JSON.stringify({ timed_out: timedOut?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Timeout error:", err);
    return new Response("Error", { status: 500 });
  }
});
