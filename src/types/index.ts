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

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  origin: PlaceResult;
  destination: PlaceResult;
  waypoints: PlaceResult[];
  completed: boolean;
  leg_routes: LegRoute[];
  departure_time: string | null;
  created_at: string;
  updated_at: string;
}
