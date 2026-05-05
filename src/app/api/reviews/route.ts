import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { stars, message } = await req.json();

  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Stars must be 1–5" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("reviews").insert({
    user_id: user?.id ?? null,
    stars,
    message: message?.trim() || null,
  });

  if (error) {
    console.error("Review insert error:", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
