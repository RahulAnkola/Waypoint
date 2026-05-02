"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { setMapsPreferenceLocal, setDistanceUnitLocal } from "@/lib/mapsUtils";
import type { UserProfile, MapsPreference, DistanceUnit } from "@/types";
import {
  User, MapPin, Lock, Save, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Gauge,
} from "lucide-react";

/* ── tiny reusable status row ── */
function StatusRow({ status, error }: { status: "idle" | "success" | "error"; error?: string }) {
  if (status === "idle") return null;
  if (status === "success")
    return (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fade-in">
        <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
      </p>
    );
  return (
    <div className="flex items-start gap-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-xs text-red-500">{error || "Something went wrong."}</p>
    </div>
  );
}

/* ── card wrapper ── */
function Card({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-fit">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-blue-600">{icon}</span>
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── maps preference labels ── */
const PREF_OPTIONS: { id: MapsPreference; label: string; sub: string }[] = [
  { id: "google", label: "Google Maps",    sub: "Default — works on all devices" },
  { id: "apple",  label: "Apple Maps",     sub: "Best on iPhone & Mac" },
  { id: "waze",   label: "Waze",           sub: "Live traffic & community alerts" },
  { id: "ask",    label: "Ask every time", sub: "Choose per tap" },
];

/* ─────────────────────────────────────────── */
export default function ProfileClient({
  profile,
  userEmail,
}: {
  profile: UserProfile;
  userEmail: string;
}) {
  /* ── username ── */
  const [username, setUsername]   = useState(profile.username ?? "");
  const [userSaving, setUserSaving] = useState(false);
  const [userStatus, setUserStatus] = useState<"idle" | "success" | "error">("idle");
  const [userError, setUserError]   = useState("");

  /* ── maps preference ── */
  const [mapsPref, setMapsPref]     = useState<MapsPreference>(profile.maps_preference ?? "google");
  const [mapsSaving, setMapsSaving] = useState(false);
  const [mapsStatus, setMapsStatus] = useState<"idle" | "success" | "error">("idle");
  const [mapsError, setMapsError]   = useState("");

  /* ── distance unit ── */
  const [distUnit, setDistUnit]       = useState<DistanceUnit>(profile.distance_unit ?? "mi");
  const [unitSaving, setUnitSaving]   = useState(false);
  const [unitStatus, setUnitStatus]   = useState<"idle" | "success" | "error">("idle");
  const [unitError, setUnitError]     = useState("");

  /* ── password ── */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurr, setShowCurr]   = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwStatus, setPwStatus]   = useState<"idle" | "success" | "error">("idle");
  const [pwError, setPwError]     = useState("");

  // Sync localStorage preferences on mount
  useEffect(() => {
    setMapsPreferenceLocal(profile.maps_preference ?? "google");
    setDistanceUnitLocal(profile.distance_unit ?? "mi");
  }, [profile.maps_preference, profile.distance_unit]);

  /* ── handlers ── */
  const saveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) { setUserStatus("error"); setUserError("Name can't be empty."); return; }
    setUserSaving(true); setUserStatus("idle");
    const { error } = await createClient()
      .from("profiles")
      .update({ username: trimmed, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setUserSaving(false);
    if (error) { setUserStatus("error"); setUserError(error.message); }
    else { setUserStatus("success"); setTimeout(() => setUserStatus("idle"), 3000); }
  };

  const saveMapsPref = async (pref: MapsPreference) => {
    setMapsPref(pref);
    setMapsSaving(true); setMapsStatus("idle");
    setMapsPreferenceLocal(pref);
    const { error } = await createClient()
      .from("profiles")
      .update({ maps_preference: pref, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setMapsSaving(false);
    if (error) { setMapsStatus("error"); setMapsError(error.message); }
    else { setMapsStatus("success"); setTimeout(() => setMapsStatus("idle"), 2500); }
  };

  const saveDistUnit = async (unit: DistanceUnit) => {
    setDistUnit(unit);
    setUnitSaving(true); setUnitStatus("idle");
    setDistanceUnitLocal(unit);
    const { error } = await createClient()
      .from("profiles")
      .update({ distance_unit: unit, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setUnitSaving(false);
    if (error) { setUnitStatus("error"); setUnitError(error.message); }
    else { setUnitStatus("success"); setTimeout(() => setUnitStatus("idle"), 2500); }
  };

  const savePassword = async () => {
    if (newPw.length < 6) {
      setPwStatus("error"); setPwError("Password must be at least 6 characters."); return;
    }
    if (newPw !== confirmPw) {
      setPwStatus("error"); setPwError("Passwords don't match."); return;
    }
    setPwSaving(true); setPwStatus("idle"); setPwError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPw,
    });
    if (signInError) {
      setPwSaving(false);
      setPwStatus("error");
      setPwError("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) { setPwStatus("error"); setPwError(error.message); }
    else {
      setPwStatus("success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwStatus("idle"), 3000);
    }
  };

  /* ── input shared class ── */
  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 " +
    "focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ══ LEFT COLUMN ══ */}
      <div className="space-y-6">

        {/* ── Display name ── */}
        <Card icon={<User className="w-4 h-4" />} title="Display name">
          <p className="text-xs text-gray-400 dark:text-gray-400 mb-3">
            Shown in the navbar instead of your email address.
          </p>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setUserStatus("idle"); }}
            placeholder="e.g. Alex"
            maxLength={32}
            className={inputCls}
          />
          <div className="flex items-center justify-between mt-3">
            <StatusRow status={userStatus} error={userError} />
            <button
              onClick={saveUsername}
              disabled={userSaving}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 active:scale-[0.97] transition-all"
            >
              {userSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </Card>

        {/* ── Distance unit ── */}
        <Card icon={<Gauge className="w-4 h-4" />} title="Distance unit">
          <p className="text-xs text-gray-400 mb-4">
            Controls how distances are shown across all trips and the planner.
          </p>

          {/* Toggle pill */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl w-fit">
            {(["mi", "km"] as DistanceUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => saveDistUnit(unit)}
                className={`relative px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 active:scale-[0.97] ${
                  distUnit === unit
                    ? "bg-white dark:bg-gray-600 text-blue-700 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {unit === "mi" ? "mi" : "km"}
                {distUnit === unit && unitSaving && (
                  <span className="absolute -top-1 -right-1">
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-400 mt-3">
            {distUnit === "mi"
              ? "Showing distances in miles (mi)"
              : "Showing distances in kilometres (km)"}
          </p>

          <div className="mt-2">
            <StatusRow status={unitStatus} error={unitError} />
          </div>
        </Card>

        {/* ── Change password ── */}
        <Card icon={<Lock className="w-4 h-4" />} title="Change password">
          <div className="space-y-3">
            {/* Current password */}
            <div className="relative">
              <input
                type={showCurr ? "text" : "password"}
                value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setPwStatus("idle"); }}
                placeholder="Current password"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowCurr(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* New password */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwStatus("idle"); }}
                placeholder="New password (min 6 chars)"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm */}
            <input
              type="password"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setPwStatus("idle"); }}
              placeholder="Confirm new password"
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <StatusRow status={pwStatus} error={pwError} />
            <button
              onClick={savePassword}
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 active:scale-[0.97] transition-all"
            >
              {pwSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Update password
            </button>
          </div>
        </Card>

      </div>

      {/* ══ RIGHT COLUMN ══ */}
      <div className="space-y-6">

        {/* ── Maps app ── */}
        <Card icon={<MapPin className="w-4 h-4" />} title="Maps app">
          <p className="text-xs text-gray-400 dark:text-gray-400 mb-4">
            Controls which app opens when you tap a Maps button on any trip.
          </p>
          <div className="space-y-2">
            {PREF_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => saveMapsPref(opt.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all active:scale-[0.99] ${
                  mapsPref === opt.id
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-100"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {/* Radio dot */}
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  mapsPref === opt.id ? "border-blue-600" : "border-gray-300 dark:border-gray-500"
                }`}>
                  {mapsPref === opt.id && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{opt.label}</span>
                  <span className="block text-xs text-gray-400 dark:text-gray-400">{opt.sub}</span>
                </span>
                {mapsPref === opt.id && mapsSaving && (
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin ml-auto" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <StatusRow status={mapsStatus} error={mapsError} />
          </div>
        </Card>

      </div>

    </div>
  );
}
