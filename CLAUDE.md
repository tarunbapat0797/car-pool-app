@AGENTS.md

# Carpool App

Office carpool coordination for a small group (~10–15 people). Free-tier MVP: deployed on Vercel + MongoDB Atlas free tier.

## Stack

- **Framework:** Next.js 16 (breaking changes — see AGENTS.md and notes below)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (radix-ui primitives)
- **Database:** MongoDB via Mongoose 9
- **Auth:** JWT in an httpOnly cookie (`token`, 7-day expiry) — no NextAuth
- **Forms:** react-hook-form + zod
- **Toasts:** sonner

## Project Structure

```
app/
  (auth)/login|signup/   — public auth pages
  dashboard/             — protected shell (layout.tsx redirects if no cookie)
    offer/               — create a new ride
    bookings/            — rider's booking history
    profile/             — user profile
  api/
    auth/login|signup|logout|me/
    rides/               — GET (list+filter), POST (create)
    rides/[id]/          — GET, DELETE (cancel)
    rides/[id]/book/     — POST (book a seat)
    bookings/            — GET (my bookings)
    bookings/[id]/cancel/— PATCH
    users/me/            — PATCH (update profile)
lib/
  auth.ts      — JWT helpers + cookie read/write (all cookie calls are async)
  db.ts        — Mongoose singleton connection
  models/
    user.ts    — User (name, email, phone, passwordHash, role, isActive)
    ride.ts    — Ride (driverId, date, departureTime IST, direction, stops, seats, fare, status)
    booking.ts — Booking (rideId, riderId, pickupStop, dropStop, status, paymentStatus)
components/ui/ — shadcn/ui primitives only (card, button, input, label, badge, select, sonner)
proxy.ts       — Route protection (Next.js 16 renamed middleware → proxy.ts)
```

## Next.js 16 Breaking Changes

These differ from training data — apply carefully:

- **Middleware renamed:** `middleware.ts` → `proxy.ts`, export named `proxy` (not `middleware`)
- **`cookies()` is async:** Always `await cookies()` from `next/headers`
- **Dynamic route params:** `ctx.params` is a Promise — always `await ctx.params` in Route Handlers
- **Mongoose 9 pre-save hooks:** No `next()` callback — hooks are plain `async function()`

## Auth Pattern

All protected Route Handlers call `getCurrentUser()` from `lib/auth.ts` which reads and verifies the JWT cookie. Returns `JWTPayload | null`. Return 401 if null.

```ts
const user = await getCurrentUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

Dashboard layout (`app/dashboard/layout.tsx`) calls `getCurrentUser()` server-side and `redirect('/login')` if null.

## Data Model Notes

- **Single user type** — any user can be a driver or rider; no separate accounts
- **Rides are per-day** — `date` stored as UTC midnight; `departureTime` is IST string `"HH:MM"`
- **IST ↔ UTC conversion:** `departureUTC = date + (h - 5)h + (m - 30)m` (IST is UTC+5:30)
- **Ride status** auto-updates via Mongoose pre-save hook: `open` → `full` when `bookedSeats >= totalSeats`
- **Booking uniqueness:** compound index `{ rideId, riderId }` — one booking per rider per ride
- **Booking reactivation:** cancelled bookings are reactivated (not duplicated) on re-book

## Business Rules

- Rides can only be offered within the next 7 days (not past, not >7 days out)
- Cannot offer a ride if departure time has already passed
- Cannot book your own ride
- Cannot book a departed ride
- Cannot offer a ride if you already have a confirmed booking for the same date+direction
- Cannot create a duplicate ride (same driver, date, direction, active status)

## Environment Variables

```
MONGO_DB_URI=   # MongoDB Atlas connection string
JWT_SECRET=     # Secret for jsonwebtoken signing
```

## Dev

```bash
npm run dev     # starts on http://localhost:3000
npm run build   # type-check + build
npm run lint    # eslint
```
