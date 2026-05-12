# Waypoint

A road trip planner built for people who actually drive. Plan routes, save trips, and get AI-powered suggestions — all in one place.

**Live:** [waypoint-blush.vercel.app](https://waypoint-blush.vercel.app)

---

## Features

- **Route planner** — add stops, compare route alternatives, see total distance and drive time
- **AI companion** — ask questions about your trip, get stop suggestions added directly to your route
- **Trip saving** — log trips with notes, save and revisit past routes
- **Mobile-first planner** — full-screen map with a bottom-sheet interface built for phones
- **Dark mode** — ALM editorial design system, light and dark

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Auth + Database** — Supabase
- **Maps** — Google Maps API (Places, Directions, Distance Matrix)
- **AI** — Claude API (Anthropic)
- **Hosting** — Vercel
- **Analytics** — Vercel Analytics + Speed Insights

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Google Maps API key (with Maps JavaScript, Places, Directions APIs enabled)
- Anthropic API key

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/RahulAnkola/Waypoint.git
cd Waypoint
npm install
```

2. Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
ANTHROPIC_API_KEY=your_anthropic_key
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── planner/          # Route planner
│   ├── trips/            # Saved trips
│   ├── profile/          # User profile
│   ├── auth/             # Login / signup
│   └── api/              # API routes (AI, maps)
├── components/           # Shared UI components
│   ├── PlannerMobile.tsx # Mobile bottom-sheet planner
│   ├── TripMap.tsx       # Google Maps integration
│   ├── AiChat.tsx        # AI chat overlay
│   └── Navbar.tsx        # Navigation + drawer
├── lib/                  # Supabase client, map utils
└── types/                # Shared TypeScript types
```

## License

MIT
