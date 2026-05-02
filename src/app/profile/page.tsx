import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/types";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/profile");

  // Upsert so the row always exists (handles users created before the trigger)
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
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">{user.email}</p>
      </div>
      <ProfileClient profile={profile} userEmail={user.email ?? ""} />
    </div>
  );
}
