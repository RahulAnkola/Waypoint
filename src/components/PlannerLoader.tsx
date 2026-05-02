"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trip, PlaceResult, LegRoute } from "@/types";

interface Props {
  tripId: string;
  onLoaded: (data: {
    name: string;
    origin: PlaceResult;
    destination: PlaceResult;
    waypoints: PlaceResult[];
    departure_time: string | null;
    departure_date: string | null;
    leg_routes: LegRoute[];
  }) => void;
}

export default function PlannerLoader({ tripId, onLoaded }: Props) {
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single()
      .then(({ data }) => {
        if (data) {
          const trip = data as Trip;
          onLoaded({
            name: trip.name,
            origin: trip.origin,
            destination: trip.destination,
            waypoints: trip.waypoints,
            departure_time: trip.departure_time,
            departure_date: trip.departure_date,
            leg_routes: trip.leg_routes ?? [],
          });
        }
      });
  }, [tripId, onLoaded]);

  return null;
}
