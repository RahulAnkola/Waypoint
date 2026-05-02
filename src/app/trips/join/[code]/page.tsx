import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?redirectTo=/trips/join/${code}`);

  // Single SECURITY DEFINER RPC: looks up the trip AND appends the user
  // to user_ids — both steps bypass RLS so a non-member can join.
  const { data, error } = await supabase.rpc("join_trip_by_code", { p_code: code });

  if (error || !data || (data as { error?: string }).error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Invalid link</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          This share link doesn&apos;t exist or has expired.
        </p>
        <Link href="/trips" className="text-blue-600 hover:underline text-sm font-medium">
          Back to My Trips
        </Link>
      </div>
    );
  }

  const tripId = (data as { trip_id: string }).trip_id;
  redirect(`/trips/${tripId}`);
}
