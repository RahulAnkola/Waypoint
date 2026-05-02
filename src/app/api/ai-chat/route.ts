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

  const contextLines: string[] = ["You are a helpful road trip assistant."];
  contextLines.push("You ONLY answer questions related to the user's current trip or road travel in general.");
  contextLines.push("If asked about anything unrelated to road trips, travel, navigation, stops, or the trip details below, politely decline and redirect to trip-related topics.");
  contextLines.push("");
  contextLines.push("Current trip details:");
  if (tripContext.tripName) contextLines.push(`- Trip name: ${tripContext.tripName}`);
  if (tripContext.origin) contextLines.push(`- Origin: ${tripContext.origin}`);
  if (tripContext.destination) contextLines.push(`- Destination: ${tripContext.destination}`);
  if (tripContext.stops && tripContext.stops.length > 0)
    contextLines.push(`- Stops along the way: ${tripContext.stops.join(" → ")}`);
  if (tripContext.departureDate) contextLines.push(`- Departure date: ${tripContext.departureDate}`);
  if (tripContext.departureTime) contextLines.push(`- Departure time: ${tripContext.departureTime}`);
  if (tripContext.totalDuration) contextLines.push(`- Estimated total drive time: ${tripContext.totalDuration}`);
  if (tripContext.totalDistance) contextLines.push(`- Estimated total distance: ${tripContext.totalDistance}`);
  if (tripContext.legs && tripContext.legs.length > 0) {
    contextLines.push("- Legs:");
    tripContext.legs.forEach((l, i) => {
      contextLines.push(`  Leg ${i + 1}: ${l.from} → ${l.to} (${l.duration}, ${l.distance}, via ${l.route})`);
    });
  }
  contextLines.push("");
  contextLines.push("Keep responses concise and helpful. Focus on practical suggestions: gas stations, food, rest stops, attractions, traffic tips, weather considerations, or anything useful for the trip.");

  const systemInstruction = contextLines.join("\n");

  const geminiContents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: geminiContents,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.7,
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
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";

  return NextResponse.json({ reply });
}
