import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug parameter", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look up the file_path by url_slug (exact match including .webp)
  const { data, error } = await supabase
    .from("media_files")
    .select("file_path")
    .eq("url_slug", slug)
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback: try using the slug directly as the storage path
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/media/${slug}`;
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: storageUrl },
    });
  }

  // Redirect to the actual storage file
  const storageUrl = `${supabaseUrl}/storage/v1/object/public/media/${data.file_path}`;
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: storageUrl,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});
