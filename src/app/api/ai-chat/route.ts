import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "model";
  content: string;
}

interface TripContext {
  tripName?: string;
  origin?: string;
  destination?: string;
  stops?: string[];
  departureTime?: string;
  departureDate?: string;
  totalDuration?: string;
  totalDistance?: string;
  legs?: { from: string; to: string; duration: string; distance: string; route: string }[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI chat not configured" }, { status: 503 });
  }

  const body = await req.json();
  const messages: Message[] = body.messages ?? [];
  const tripContext: TripContext = body.tripContext ?? {};

  const tripLines: string[] = [];
  if (tripContext.tripName) tripLines.push(`Trip name: ${tripContext.tripName}`);
  if (tripContext.origin) tripLines.push(`Origin: ${tripContext.origin}`);
  if (tripContext.destination) tripLines.push(`Destination: ${tripContext.destination}`);
  if (tripContext.stops?.length) tripLines.push(`Stops: ${tripContext.stops.join(" → ")}`);
  if (tripContext.departureDate) tripLines.push(`Departure date: ${tripContext.departureDate}`);
  if (tripContext.departureTime) tripLines.push(`Departure time: ${tripContext.departureTime}`);
  if (tripContext.totalDuration) tripLines.push(`Total drive time: ${tripContext.totalDuration}`);
  if (tripContext.totalDistance) tripLines.push(`Total distance: ${tripContext.totalDistance}`);
  if (tripContext.legs?.length) {
    tripLines.push("Route legs:");
    tripContext.legs.forEach((l, i) => {
      tripLines.push(`  Leg ${i + 1}: ${l.from} to ${l.to} — ${l.duration}, ${l.distance}, via ${l.route}`);
    });
  }

  const systemInstruction = `You are a knowledgeable, enthusiastic road trip companion. You only answer questions about road trips, travel, stops, dining, attractions, gas, rest areas, and the user's specific trip. For anything unrelated, politely redirect.

Trip context:
${tripLines.length ? tripLines.join("\n") : "No trip set yet."}

Rules:
1. Suggest exactly 3 to 5 specific, real named places relevant to the question. Use places that actually exist and match the route/region.
2. Write in warm, conversational plain text — no markdown, no asterisks, no dashes as bullet points, no bold, no hashtags, no special characters.
3. End every reply with a short, natural follow-up question that invites the user to continue the conversation (e.g. about food preferences, budget, whether they want more stops, etc.).
4. Keep the reply under 120 words — friendly and direct, not a wall of text.
5. For the suggestions array: each entry MUST have "name" (the place name) and "address" (City, State or full street address). Do not include extra fields.

You MUST respond with ONLY a valid JSON object on a single line. No code fences, no markdown, no text before or after. Exact format:
{"reply":"your conversational response here ending with a question","suggestions":[{"name":"Actual Place Name","address":"City, State"},{"name":"Another Place","address":"City, State"}]}`;

  const geminiContents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: geminiContents,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  let reply = "Sorry, I couldn't generate a response.";
  let suggestions: { name: string; address: string }[] = [];

  function parseGeminiJson(text: string): Record<string, unknown> | null {
    // Try direct parse first (Gemini returns clean JSON most of the time)
    try { return JSON.parse(text.trim()); } catch { /* fall through */ }
    // Strip markdown code fences if present
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    try { return JSON.parse(stripped); } catch { /* fall through */ }
    // Last resort: find first {...} block (handles extra prose before/after)
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  const outer = parseGeminiJson(rawText);
  if (outer) {
    let replyStr = typeof outer.reply === "string" ? outer.reply : rawText;
    let sugsVal = Array.isArray(outer.suggestions) ? outer.suggestions : [];

    // Gemini sometimes double-wraps: reply field itself contains a JSON string
    for (let depth = 0; depth < 3; depth++) {
      if (!replyStr.trimStart().startsWith("{")) break;
      const inner = parseGeminiJson(replyStr);
      if (!inner || typeof inner.reply !== "string") break;
      replyStr = inner.reply;
      if (Array.isArray(inner.suggestions) && inner.suggestions.length > 0) {
        sugsVal = inner.suggestions;
      }
    }

    reply = replyStr.replace(/[*_`#]/g, "").trim();
    suggestions = (sugsVal as unknown[]).filter(
      (s): s is { name: string; address: string } =>
        !!s && typeof s === "object" &&
        typeof (s as Record<string, unknown>).name === "string" &&
        typeof (s as Record<string, unknown>).address === "string"
    );
  } else {
    reply = rawText.replace(/[*_`#]/g, "").trim();
  }

  return NextResponse.json({ reply, suggestions });
}
