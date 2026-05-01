"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/planner";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 overflow-hidden">
      {/* Floating background blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-blue-300 blur-3xl opacity-40 animate-blob" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-violet-300 blur-3xl opacity-40 animate-blob-2" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-100/40 border border-white/60 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-blue-200 blur-xl opacity-70 animate-pulse-glow" />
                <div className="relative bg-blue-50 p-3 rounded-full border border-blue-100">
                  <MapPin className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome <span className="text-gradient-static">back</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Log in to your Waypoint account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "180ms" }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100 animate-slide-up">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shine btn-tap w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 animate-slide-up"
              style={{ animationDelay: "260ms" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="link-underline text-blue-600 font-medium"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
