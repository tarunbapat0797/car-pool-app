# Carpool App

An office carpool coordination app for small teams (~10–15 people). Anyone can offer a ride or book a seat — no separate driver/rider accounts. Built as a free-tier MVP on Vercel + MongoDB Atlas.

## Features

- **Offer a ride** — set date, direction (to/from office), stops with times, seats, and fare
- **Browse & book rides** — filter by date, direction, or stop; book a seat in one tap
- **Manage bookings** — view your upcoming rides and cancel if plans change
- **Profile** — update your name, phone number
- **Auth** — email/password signup and login with JWT stored in an httpOnly cookie

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Forms | react-hook-form + zod |
| Toasts | sonner |

## Prerequisites

- Node.js 20+
- A MongoDB connection string (MongoDB Atlas free tier works)

## Local Setup

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd carpool-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root:

   ```env
   MONGO_DB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/carpool
   JWT_SECRET=your-secret-key-min-32-chars
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Type-check and build for production
npm run start    # Start production server (after build)
npm run lint     # Run ESLint
```

## Project Structure

```
app/
  (auth)/          — Login and signup pages (public)
  dashboard/       — Protected app shell
    offer/         — Create a new ride
    bookings/      — View and cancel your bookings
    profile/       — Edit your profile
  api/
    auth/          — login, signup, logout, me
    rides/         — list, create, cancel rides
    rides/[id]/book/ — book a seat
    bookings/      — list bookings
    bookings/[id]/cancel/ — cancel a booking
    users/me/      — update profile
lib/
  auth.ts          — JWT helpers and cookie utilities
  db.ts            — Mongoose connection singleton
  models/          — User, Ride, Booking schemas
components/ui/     — shadcn/ui primitives
proxy.ts           — Route protection (Next.js 16 middleware)
```

## Data Model Overview

- **User** — name, email, phone, hashed password, role (`user` | `admin`)
- **Ride** — driver, date, departure time (IST), direction (`to_office` | `from_office`), stops, total/booked seats, fare, status (`open` | `full` | `cancelled` | `completed`)
- **Booking** — ride, rider, pickup stop, drop stop, status (`confirmed` | `cancelled` | `no_show`), payment status

## Key Business Rules

- Rides can only be offered up to 7 days in advance
- You cannot book your own ride
- You cannot offer a ride if you already have a confirmed booking for the same date and direction
- Departed rides are hidden from other users but remain visible to the driver
- Ride status automatically flips to `full` when all seats are booked

## Deployment

The app is designed to deploy on **Vercel** with zero configuration:

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `MONGO_DB_URI` and `JWT_SECRET` as environment variables in the Vercel dashboard
4. Deploy

## Contributing

1. Fork the repo and create a feature branch
2. Read [CLAUDE.md](./CLAUDE.md) for architecture decisions and Next.js 16 gotchas before writing code
3. Run `npm run build` to confirm no type errors before opening a PR
