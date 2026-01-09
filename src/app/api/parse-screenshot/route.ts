import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Determine media type
    const mediaType = image.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    // Call Claude Vision
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: `You are analyzing a betting slip screenshot from a UK bookmaker (likely Paddy Power, Bet365, William Hill, or similar).

Extract the following information and return it as JSON only - no explanation, no markdown, just raw JSON:

{
  "bet_type": "single" | "double" | "treble" | "acca" | "other",
  "stake": number (in GBP, e.g. 5.00),
  "potential_return": number (total returns if bet wins),
  "status": "pending" | "won" | "lost" | "void",
  "placed_at": "ISO date string or null if not visible",
  "legs": [
    {
      "selection": "string (the pick, e.g. 'Arsenal to win')",
      "event_name": "string (the match/event, e.g. 'Arsenal vs Chelsea')",
      "odds_decimal": number (e.g. 2.50),
      "odds_fractional": "string (e.g. '6/4')",
      "result": "pending" | "won" | "lost" | "void"
    }
  ]
}

Rules:
- If odds are shown as decimal, convert to fractional for odds_fractional
- If odds are shown as fractional, convert to decimal for odds_decimal  
- Look for status indicators: green tick = won, red X = lost, clock/pending = pending
- For accumulators, the bet_type should be "acca"
- If you can't determine a value, use reasonable defaults (e.g. "pending" for status)
- stake and potential_return should be numbers, not strings
- Return ONLY the JSON, no other text`,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON from response
    let parsed;
    try {
      // Remove any potential markdown code blocks
      const jsonText = textBlock.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse Claude response:", textBlock.text);
      throw new Error("Failed to parse betting slip");
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Screenshot parsing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse screenshot" },
      { status: 500 }
    );
  }
}
