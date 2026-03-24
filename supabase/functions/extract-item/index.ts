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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { mode, url, imageBase64 } = await req.json();

    const systemPrompt = `You are a fashion item extractor. Extract clothing item details and return them using the extract_item tool. For category, use one of: tops, bottoms, outerwear, dresses, shoes, accessories. For hex, pick the closest Dark Autumn palette color hex from these: #6B7A3A (olive), #4A5228 (deep olive), #5C3317 (chocolate), #9B4A2A (rust), #2E6E68 (teal), #E8D5B0 (cream), #A0682A (caramel), #C19A5B (camel), #B08030 (gold), #3A4A5C (denim), #E8E4DC (white), #B85C38 (terracotta), #4A2410 (chocolate bark), #D4C4A0 (oatmeal), #1A4C47 (deep teal), #3B1F14 (espresso).`;

    let userContent: unknown;

    if (mode === "url") {
      userContent = `Extract the clothing item details from this product URL: ${url}. Identify the item name, brand, color, category, and write a brief styling note.`;
    } else if (mode === "photo") {
      userContent = [
        {
          type: "text",
          text: "Identify this clothing item from the photo. Extract the item name/type, color, likely category, and write a brief styling note.",
        },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: imageBase64,
          },
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use "url" or "photo".' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: userContent },
        ],
        tools: [
          {
            name: "extract_item",
            description: "Extract structured clothing item details",
            input_schema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Item name" },
                brand: { type: "string", description: "Brand name, empty if unknown" },
                category: {
                  type: "string",
                  enum: ["tops", "bottoms", "outerwear", "dresses", "shoes", "accessories"],
                },
                color: { type: "string", description: "Color label e.g. 'Olive', 'Dark Brown'" },
                hex: { type: "string", description: "Hex color code from the Dark Autumn palette" },
                notes: { type: "string", description: "Brief styling note (1-2 sentences)" },
              },
              required: ["name", "category", "color", "hex"],
              additionalProperties: false,
            },
          },
        ],
        tool_choice: { type: "tool", name: "extract_item" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorBody = await response.text();
      console.error("Anthropic API error:", status, errorBody);
      if (status === 401) {
        return new Response(JSON.stringify({ error: "Invalid Anthropic API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Anthropic API error [${status}]: ${errorBody}`);
    }

    const data = await response.json();
    const toolUse = data.content?.find((block: any) => block.type === "tool_use");
    if (!toolUse) throw new Error("No extraction result");

    const extracted = toolUse.input;

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-item error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}, { verify: false });
