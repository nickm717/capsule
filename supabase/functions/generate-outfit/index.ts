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
    const { wardrobeItems, existingOutfits, criteria } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { anchorPieceId, occasion, temperature, mustIncludeCategory } = criteria;

    // Build wardrobe context
    const wardrobeContext = wardrobeItems
      .map((i: any) => `[${i.id}] ${i.name} | ${i.brand || "no brand"} | ${i.color} (${i.hex}) | ${i.category} | ${i.owned ? "owned" : "rental"}`)
      .join("\n");

    // Build existing outfits context to avoid duplicates
    const existingContext = existingOutfits
      .map((o: any) => `"${o.name}": ${o.pieces.map((p: any) => p.name).join(", ")}`)
      .join("\n");

    const anchorNote = anchorPieceId
      ? `\nANCHOR PIECE: The outfit MUST include item ID [${anchorPieceId}]. Build around it.`
      : "";

    const categoryNote = mustIncludeCategory
      ? `\nMUST INCLUDE: At least one piece from the "${mustIncludeCategory}" category.`
      : "";

    const systemPrompt = `You are a personal stylist specializing in the Dark Autumn color season.

COLOR SEASON PROFILE — Dark Autumn:
- Best colors: warm, muted, earthy tones — olive, rust, chocolate, camel, cream, teal, gold, terracotta, espresso, deep olive, oatmeal, caramel, salmon, denim
- AVOID: cool tones (blue-based), bright/neon colors, high-contrast black-and-white combinations
- Aim for tonal harmony: pieces should share warmth and depth

STYLING RULES:
- Balance proportions (fitted top + relaxed bottom, or vice versa)
- Layer intentionally (a top, optional mid-layer, bottom, shoes, optional outerwear)
- Match real-world wearability for the occasion and temperature
- 3–6 pieces per outfit is ideal
- Don't repeat the exact same combination as an existing outfit

WARDROBE (available pieces):
${wardrobeContext}

EXISTING OUTFITS (avoid duplicating):
${existingContext || "None yet"}
${anchorNote}${categoryNote}

TASK: Create ONE outfit for occasion "${occasion}" in "${temperature}" weather.
Select piece IDs from the wardrobe above. Return structured JSON via the tool call.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Generate an outfit for ${occasion} in ${temperature} weather. Pick the best combination of pieces from my wardrobe.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_outfit",
                description: "Create a curated outfit from wardrobe pieces",
                parameters: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Creative outfit name, 2-4 words, evocative and specific",
                    },
                    piece_ids: {
                      type: "array",
                      items: { type: "string" },
                      description: "Array of wardrobe item IDs to include in the outfit",
                    },
                    notes: {
                      type: "string",
                      description: "1-2 sentence styling note in second person about how to wear the pieces together",
                    },
                  },
                  required: ["name", "piece_ids", "notes"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_outfit" } },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error(`AI gateway error [${status}]`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        name: result.name || "",
        piece_ids: result.piece_ids || [],
        notes: result.notes || "",
        occasion,
        temperature,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-outfit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
