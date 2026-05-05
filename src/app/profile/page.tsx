import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/types";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/profile");

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile: UserProfile = data ?? {
    id: user.id,
    username: null,
    maps_preference: "google",
    distance_unit: "mi",
    updated_at: new Date().toISOString(),
  };

  return (
    <div style={{ background: "var(--alm-bg)", color: "var(--alm-ink)", minHeight: "calc(100vh - 100px)" }}>
      {/* Masthead */}
      <div
        style={{
          padding: "40px 28px 28px",
          borderBottom: "2px solid var(--alm-ink)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>
          ★ Membership card ★
        </div>
        <h1
          className="alm-display"
          style={{ fontSize: "clamp(44px, 7vw, 72px)", lineHeight: 0.9, margin: "0 0 8px", fontWeight: 400, letterSpacing: "-0.03em" }}
        >
          Profile
        </h1>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--alm-ink2)", letterSpacing: "0.05em" }}>
          {user.email}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px", background: "var(--alm-cream)" }}>
        <ProfileClient profile={profile} userEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
