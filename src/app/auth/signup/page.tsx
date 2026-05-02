"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-emerald-300 blur-3xl opacity-40 animate-blob" />
          <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-blue-300 blur-3xl opacity-40 animate-blob-2" />
        </div>

        <div className="relative w-full max-w-md bg-white/85 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-100/40 border border-white/60 p-8 text-center animate-pop-in">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-emerald-200 blur-xl opacity-70 animate-pulse-glow" />
              <div className="relative bg-emerald-50 p-3 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to{" "}
            <strong className="text-gray-700">{email}</strong>. Click it to
            activate your account.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="btn-tap link-underline text-blue-600 font-semibold text-sm"
          >
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-blue-300 blur-3xl opacity-40 animate-blob" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-pink-300 blur-3xl opacity-40 animate-blob-2" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-white/85 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-100/40 border border-white/60 dark:border-gray-700 p-8">
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
              Create an <span className="text-gradient-static">account</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Start planning your road trips
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "160ms" }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "220ms" }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
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
              style={{ animationDelay: "300ms" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="link-underline text-blue-600 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
