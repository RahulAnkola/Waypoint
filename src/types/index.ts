export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

/** One route alternative for a single leg */
export interface RouteOption {
  index: number;
  distance: string;
  duration: string;
  summary: string;
  durationSeconds: number;
}

/** Available route options for a leg — used in planner UI */
export interface LegInfo {
  legIndex: number;
  from: string;
  to: string;
  routes: RouteOption[];
}

/** The saved choice for a leg — stored in DB */
export interface LegRoute {
  legIndex: number;
  routeIndex: number;
  summary: string;
  distance: string;
  duration: string;
  durationSeconds: number;
}

export type MapsPreference = "google" | "apple" | "waze" | "ask";
export type DistanceUnit = "mi" | "km";

export interface UserProfile {
  id: string;
  username: string | null;
  maps_preference: MapsPreference;
  distance_unit: DistanceUnit;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Trip {
  id: string;
  /** Ordered list of user IDs. Index 0 = organiser, rest = members. */
  user_ids: string[];
  name: string;
  origin: PlaceResult;
  destination: PlaceResult;
  waypoints: PlaceResult[];
  completed: boolean;
  leg_routes: LegRoute[];
  departure_time: string | null;
  departure_date: string | null;
  notes: string | null;
  checklist: ChecklistItem[] | null;
  share_code: string | null;
  created_at: string;
  updated_at: string;
}
