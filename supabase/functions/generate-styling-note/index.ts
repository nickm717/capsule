import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pieces } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const pieceList = pieces
      .map((p: { name: string; color: string }) => `${p.name} (${p.color})`)
      .join(", ");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system:
          "You are a personal stylist for a Dark Autumn color palette wardrobe. Respond with JSON: {\"name\": \"<short creative outfit name, 2-4 words>\", \"note\": \"<1-2 sentence styling note in second person. Be specific about how to wear the pieces together (tuck, layer, roll sleeves, etc). No quotes or greetings.>\"}",
        messages: [
          {
            role: "user",
            content: `Generate an outfit name and styling note for these pieces: ${pieceList}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorBody = await response.text();
      console.error("Anthropic API error:", status, errorBody);
      if (status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid Anthropic API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Anthropic API error [${status}]: ${errorBody}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text?.trim() ?? "{}";
    let parsed: { name?: string; note?: string } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { note: raw }; }

    return new Response(JSON.stringify({ name: parsed.name ?? "", note: parsed.note ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-styling-note error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}, { verify: false });
