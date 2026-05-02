"use client";

import { useRef, useEffect, useState } from "react";
import { X, LocateFixed, Loader2 } from "lucide-react";
import type { PlaceResult } from "@/types";

interface Props {
  placeholder: string;
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  label?: string;
  showCurrentLocation?: boolean;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function PlaceAutocomplete({
  placeholder,
  value,
  onChange,
  label,
  showCurrentLocation,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.address ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(false);

  useEffect(() => {
    setInputValue(value?.address ?? "");
  }, [value]);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { fields: ["formatted_address", "geometry"] }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.geometry?.location && place.formatted_address) {
        const result: PlaceResult = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onChange(result);
        setInputValue(place.formatted_address);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  const handleClear = () => {
    onChange(null);
    setInputValue("");
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocateError(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!window.google) { setLocating(false); return; }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            setLocating(false);
            if (status === "OK" && results?.[0]) {
              const result: PlaceResult = {
                address: results[0].formatted_address,
                lat: latitude,
                lng: longitude,
              };
              onChange(result);
              setInputValue(results[0].formatted_address);
            }
          }
        );
      },
      () => {
        setLocating(false);
        setLocateError(true);
        setTimeout(() => setLocateError(false), 3000);
      },
      { timeout: 8000 }
    );
  };

  const hasValue = inputValue.length > 0;

  return (
    <div className="w-full animate-slide-up">
      {label && (
        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <div className={`relative transition-all duration-200 ${isFocused ? "scale-[1.01]" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full py-2.5 rounded-xl border text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
            placeholder-gray-400 outline-none transition-all duration-200 shadow-sm
            ${showCurrentLocation ? "pl-4 pr-16" : hasValue ? "pl-4 pr-9" : "pl-4 pr-4"}
            ${isFocused
              ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            }
          `}
        />

        {/* Right-side action buttons */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-300 hover:text-gray-500 transition-colors p-0.5"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showCurrentLocation && (
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={locating}
              title={locateError ? "Location access denied" : "Use current location"}
              className={`p-1 rounded-lg transition-all ${
                locateError
                  ? "text-red-400"
                  : locating
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              }`}
            >
              {locating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LocateFixed className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {locateError && (
        <p className="text-xs text-red-400 mt-1 animate-fade-in">
          Location access denied. Check browser permissions.
        </p>
      )}
    </div>
  );
}
