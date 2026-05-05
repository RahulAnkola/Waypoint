"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { setMapsPreferenceLocal, setDistanceUnitLocal } from "@/lib/mapsUtils";
import type { UserProfile, MapsPreference, DistanceUnit } from "@/types";
import {
  User, MapPin, Lock, Save, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Gauge,
} from "lucide-react";

function StatusRow({ status, error }: { status: "idle" | "success" | "error"; error?: string }) {
  if (status === "idle") return null;
  if (status === "success")
    return (
      <p
        className="flex items-center gap-1.5 animate-fade-in"
        style={{ fontSize: 12, fontWeight: 600, color: "var(--alm-green)", fontFamily: "var(--font-mono, monospace)" }}
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
      </p>
    );
  return (
    <div className="flex items-start gap-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--alm-red)" }} />
      <p style={{ fontSize: 12, color: "var(--alm-red)" }}>{error || "Something went wrong."}</p>
    </div>
  );
}

function Card({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--alm-cream)",
        border: "2px solid var(--alm-rule)",
        borderRadius: 4,
        padding: 24,
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span style={{ color: "var(--alm-red)" }}>{icon}</span>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--alm-ink)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

const PREF_OPTIONS: { id: MapsPreference; label: string; sub: string }[] = [
  { id: "google", label: "Google Maps",    sub: "Default — works on all devices" },
  { id: "apple",  label: "Apple Maps",     sub: "Best on iPhone & Mac" },
  { id: "waze",   label: "Waze",           sub: "Live traffic & community alerts" },
  { id: "ask",    label: "Ask every time", sub: "Choose per tap" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "2px solid var(--alm-rule)",
  borderRadius: 4,
  fontSize: 14,
  color: "var(--alm-ink)",
  background: "var(--alm-bg)",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 150ms",
  boxSizing: "border-box",
};

export default function ProfileClient({
  profile,
  userEmail,
}: {
  profile: UserProfile;
  userEmail: string;
}) {
  const [username, setUsername]   = useState(profile.username ?? "");
  const [userSaving, setUserSaving] = useState(false);
  const [userStatus, setUserStatus] = useState<"idle" | "success" | "error">("idle");
  const [userError, setUserError]   = useState("");

  const [mapsPref, setMapsPref]     = useState<MapsPreference>(profile.maps_preference ?? "google");
  const [mapsSaving, setMapsSaving] = useState(false);
  const [mapsStatus, setMapsStatus] = useState<"idle" | "success" | "error">("idle");
  const [mapsError, setMapsError]   = useState("");

  const [distUnit, setDistUnit]       = useState<DistanceUnit>(profile.distance_unit ?? "mi");
  const [unitSaving, setUnitSaving]   = useState(false);
  const [unitStatus, setUnitStatus]   = useState<"idle" | "success" | "error">("idle");
  const [unitError, setUnitError]     = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurr, setShowCurr]   = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwStatus, setPwStatus]   = useState<"idle" | "success" | "error">("idle");
  const [pwError, setPwError]     = useState("");

  useEffect(() => {
    setMapsPreferenceLocal(profile.maps_preference ?? "google");
    setDistanceUnitLocal(profile.distance_unit ?? "mi");
  }, [profile.maps_preference, profile.distance_unit]);

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

  const eyeBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--alm-ink2)",
    padding: 0,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ══ LEFT COLUMN ══ */}
      <div className="space-y-6">

        {/* Display name */}
        <Card icon={<User className="w-4 h-4" />} title="Display name">
          <p style={{ fontSize: 13, color: "var(--alm-ink2)", marginBottom: 12 }}>
            Shown in the navbar instead of your email address.
          </p>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setUserStatus("idle"); }}
            placeholder="e.g. Alex"
            maxLength={32}
            style={inputStyle}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
          />
          <div className="flex items-center justify-between mt-3">
            <StatusRow status={userStatus} error={userError} />
            <button
              onClick={saveUsername}
              disabled={userSaving}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:opacity-50 active:scale-[0.97] transition-all"
              style={{
                background: "var(--alm-ink)",
                color: "var(--alm-cream)",
                border: "2px solid var(--alm-ink)",
                borderRadius: 4,
                boxShadow: "3px 3px 0 var(--alm-red)",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 12,
                letterSpacing: "0.05em",
                cursor: userSaving ? "not-allowed" : "pointer",
              }}
            >
              {userSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </Card>

        {/* Distance unit */}
        <Card icon={<Gauge className="w-4 h-4" />} title="Distance unit">
          <p style={{ fontSize: 13, color: "var(--alm-ink2)", marginBottom: 16 }}>
            Controls how distances are shown across all trips and the planner.
          </p>

          <div
            className="flex items-center gap-1 p-1 w-fit"
            style={{
              background: "var(--alm-bg)",
              border: "2px solid var(--alm-rule)",
              borderRadius: 4,
            }}
          >
            {(["mi", "km"] as DistanceUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => saveDistUnit(unit)}
                className="relative px-6 py-2 text-sm font-bold transition-all duration-200 active:scale-[0.97]"
                style={{
                  borderRadius: 2,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 13,
                  background: distUnit === unit ? "var(--alm-ink)" : "transparent",
                  color: distUnit === unit ? "var(--alm-cream)" : "var(--alm-ink2)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {unit === "mi" ? "mi" : "km"}
                {distUnit === unit && unitSaving && (
                  <span className="absolute -top-1 -right-1">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--alm-red)" }} />
                  </span>
                )}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, color: "var(--alm-ink2)", marginTop: 12, fontFamily: "var(--font-mono, monospace)" }}>
            {distUnit === "mi"
              ? "Showing distances in miles (mi)"
              : "Showing distances in kilometres (km)"}
          </p>

          <div className="mt-2">
            <StatusRow status={unitStatus} error={unitError} />
          </div>
        </Card>

        {/* Change password */}
        <Card icon={<Lock className="w-4 h-4" />} title="Change password">
          <div className="space-y-3">
            <div style={{ position: "relative" }}>
              <input
                type={showCurr ? "text" : "password"}
                value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setPwStatus("idle"); }}
                placeholder="Current password"
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
              />
              <button
                type="button"
                onClick={() => setShowCurr(s => !s)}
                style={eyeBtnStyle}
              >
                {showCurr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwStatus("idle"); }}
                placeholder="New password (min 6 chars)"
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
              />
              <button
                type="button"
                onClick={() => setShowNew(s => !s)}
                style={eyeBtnStyle}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <input
              type="password"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setPwStatus("idle"); }}
              placeholder="Confirm new password"
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <StatusRow status={pwStatus} error={pwError} />
            <button
              onClick={savePassword}
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:opacity-40 active:scale-[0.97] transition-all"
              style={{
                background: "var(--alm-ink)",
                color: "var(--alm-cream)",
                border: "2px solid var(--alm-ink)",
                borderRadius: 4,
                boxShadow: (!pwSaving && currentPw && newPw && confirmPw) ? "3px 3px 0 var(--alm-red)" : "none",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 12,
                letterSpacing: "0.05em",
                cursor: (pwSaving || !currentPw || !newPw || !confirmPw) ? "not-allowed" : "pointer",
              }}
            >
              {pwSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Update password
            </button>
          </div>
        </Card>

      </div>

      {/* ══ RIGHT COLUMN ══ */}
      <div className="space-y-6">

        {/* Maps app */}
        <Card icon={<MapPin className="w-4 h-4" />} title="Maps app">
          <p style={{ fontSize: 13, color: "var(--alm-ink2)", marginBottom: 16 }}>
            Controls which app opens when you tap a Maps button on any trip.
          </p>
          <div className="space-y-2">
            {PREF_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => saveMapsPref(opt.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
                style={{
                  borderRadius: 4,
                  border: `2px solid ${mapsPref === opt.id ? "var(--alm-ink)" : "var(--alm-rule)"}`,
                  background: mapsPref === opt.id ? "var(--alm-ink)" : "var(--alm-bg)",
                  boxShadow: mapsPref === opt.id ? "3px 3px 0 var(--alm-red)" : "none",
                  cursor: "pointer",
                }}
              >
                {/* Radio dot */}
                <span
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: mapsPref === opt.id ? "var(--alm-cream)" : "var(--alm-rule)",
                  }}
                >
                  {mapsPref === opt.id && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--alm-red)" }}
                    />
                  )}
                </span>
                <span>
                  <span
                    className="block text-sm font-semibold"
                    style={{ color: mapsPref === opt.id ? "var(--alm-cream)" : "var(--alm-ink)" }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="block text-xs"
                    style={{
                      color: mapsPref === opt.id ? "rgba(250,243,231,0.7)" : "var(--alm-ink2)",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {opt.sub}
                  </span>
                </span>
                {mapsPref === opt.id && mapsSaving && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" style={{ color: "var(--alm-red)" }} />
                )}
              </button>
            ))}
          </div>
          {mapsPref === "waze" && (
            <p
              className="mt-3 px-3 py-2"
              style={{
                fontSize: 11,
                color: "var(--alm-amber)",
                background: "rgba(192,138,53,0.08)",
                border: "1px solid rgba(192,138,53,0.3)",
                borderRadius: 4,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              ⚠ Waze only supports origin → destination. Intermediate stops will be ignored.
            </p>
          )}
          <div className="mt-3">
            <StatusRow status={mapsStatus} error={mapsError} />
          </div>
        </Card>

      </div>

    </div>
  );
}
