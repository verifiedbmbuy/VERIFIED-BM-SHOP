import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Use service role for DB reads
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, content, target_audience } = await req.json();
    if (!subject || !content) {
      return new Response(JSON.stringify({ error: "Subject and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get email settings
    const { data: settings } = await adminClient
      .from("site_settings")
      .select("key, value")
      .in("key", ["email_provider", "email_api_key", "email_from_address"]);

    const settingsMap: Record<string, string> = {};
    if (settings) {
      for (const s of settings) settingsMap[s.key] = s.value;
    }

    const provider = settingsMap["email_provider"];
    const apiKey = settingsMap["email_api_key"];
    const fromEmail = settingsMap["email_from_address"];

    if (!apiKey || !fromEmail) {
      return new Response(
        JSON.stringify({ error: "Email service not configured. Go to Settings > General to set up your email provider." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather emails
    let emails: string[] = [];
    if (target_audience === "subscribers" || target_audience === "both") {
      const { data } = await adminClient
        .from("newsletter_subscribers")
        .select("email")
        .eq("status", "subscribed");
      if (data) emails.push(...data.map((d: any) => d.email));
    }
    if (target_audience === "customers" || target_audience === "both") {
      const { data } = await adminClient.from("profiles").select("email");
      if (data) emails.push(...data.map((d: any) => d.email).filter(Boolean));
    }
    emails = [...new Set(emails)];

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients found for the selected audience." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send emails
    let successCount = 0;
    let failCount = 0;

    if (provider === "resend") {
      // Resend supports batch or individual — send individually for simplicity
      for (const email of emails) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject,
              html: content,
            }),
          });
          if (res.ok) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }
    } else if (provider === "sendgrid") {
      for (const email of emails) {
        try {
          const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email }] }],
              from: { email: fromEmail },
              subject,
              content: [{ type: "text/html", value: content }],
            }),
          });
          if (res.ok || res.status === 202) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }
    }

    // Log the newsletter
    await adminClient.from("newsletters").insert({
      subject,
      content,
      target_audience: target_audience || "subscribers",
      recipient_count: successCount,
      sent_by: userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: emails.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-newsletter fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
