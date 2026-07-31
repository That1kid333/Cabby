# Cabby — Golf Handicap & Buddy High-Score PWA ⛳

**Cabby** (a play on *Caddy* + *Handicap*) is a luxury Progressive Web Application (PWA) built for avid golfers. It tracks your official World Handicap System (WHS 2024) Handicap Index, converts it to course handicaps, and allows you to compete with friends via live high-score leaderboards and QR code profile connections.

![Cabby Logo](/cabby-brand.png)

---

## 🌟 Key Features

1. **WHS 2024 Handicap Engine**:
   - Calculates score differentials: `(Score - Course Rating - PCC) × 113 / Slope Rating`.
   - Uses the official WHS sliding scale (best 1 of 3 up to average of best 8 of 20 rounds).
   - Identifies counted rounds instantly with green badge indicators.
2. **WHS Course Handicap Calculator**:
   - Converts your portable Handicap Index to your exact target Course Handicap: `(Index × Slope / 113) + (Rating - Par)`.
   - Supports handicap allowances for Stroke Play (95%), Match Play (100%), Four-Ball (90%), and Scrambles.
3. **Buddy High-Score Leaderboards**:
   - Compete with friends on Handicap Index, Lowest Gross Score, Best Differential, and Eagles & Hole-in-One Hall of Fame.
4. **QR Code Buddy Connections**:
   - Unique friend referral codes (e.g. `CB-8821-JT`).
   - Integrated QR Code generator & Camera QR code scanner.
5. **Clubhouse Activity Feed**:
   - Live activity posts of logged rounds, handicap drops, and personal bests.
   - Interactive reactions (🔥, ⛳, 👏, 🏆) and friend score attestation/verification.
6. **Real Course Data**:
   - Search 32,000+ real golf courses (name, location, rating, slope, par) via [OpenGolfAPI](https://opengolfapi.org) — no API key required, no fake/invented ratings.
   - Any course a golfer adds is saved to the shared database so every other Cabby golfer benefits from it too.
7. **Progressive Web App (PWA)**:
   - Installable on iOS & Android home screens.
   - Offline round logging via Service Worker cache.

---

## 🚀 Stack & Deployment Guide

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Styling**: Dark glassmorphic theme with Emerald accents (`#05C46B`) and Championship Gold (`#FFD700`).
- **Database / Backend**: Supabase — required. Schema in `/supabase/schema.sql`. There is no mock-data or offline-guest mode: without Supabase credentials, sign-up/sign-in are disabled.
- **Course Data**: [OpenGolfAPI](https://opengolfapi.org) (ODbL-1.0 licensed, free, no signup) for real course search/autofill.
- **Hosting**: Designed for Netlify & GitHub repository CI/CD (`netlify.toml` included).

### Deploying to Netlify
1. Push this repository to **GitHub**.
2. Log into **Netlify** and click **Import from Git**.
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add Supabase environment variables (**required** — Cabby has no offline/demo mode):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Run `/supabase/schema.sql` in your Supabase project's SQL editor. It's safe to re-run if you've already deployed an earlier version of this schema.
