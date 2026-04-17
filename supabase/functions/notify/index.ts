import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  type: "contact_message" | "post_published" | "new_comment";
  data: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { type, data } = payload;

    let subject = "";
    let body = "";

    switch (type) {
      case "contact_message":
        subject = `New Contact Message from ${data.name}`;
        body = `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`;
        break;
      case "post_published":
        subject = `Blog Post Published: ${data.title}`;
        body = `A new blog post "${data.title}" has been published.\n\nAuthor: ${data.author}\nCategory: ${data.category}\nSlug: /blog/${data.slug}`;
        break;
      case "new_comment":
        subject = `New Comment on "${data.post_title}"`;
        body = `A new comment requires moderation.\n\nAuthor: ${data.author_name}\nEmail: ${data.author_email}\n\nComment:\n${data.content}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Unknown notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Log notification (in production, integrate with an email service like Resend/SendGrid)
    console.log(`[NOTIFICATION] ${subject}`);
    console.log(`[BODY] ${body}`);

    return new Response(
      JSON.stringify({ success: true, subject, message: "Notification processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
