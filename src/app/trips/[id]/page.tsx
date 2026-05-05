import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Trip } from "@/types";
import TripDetailClient from "@/components/TripDetailClient";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirectTo=/trips/${id}`);

  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div style={{ background: "var(--alm-bg)", color: "var(--alm-ink)", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 64px" }}>
        <Link
          href="/trips"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--alm-ink2)",
            textDecoration: "none",
            marginBottom: 24,
            transition: "color 150ms",
          }}
          className="hover-red"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Back to My Trips
        </Link>

        <TripDetailClient trip={data as Trip} />
      </div>
    </div>
  );
}
