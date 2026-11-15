# StreamX

A full-stack OTT (Netflix-style) streaming platform. React on the frontend, a real Node.js/Express/MongoDB backend underneath — authentication, a movie catalog, search, watchlists, ratings, subscriptions with real Razorpay payments, an admin dashboard, and password reset are all built and wired end-to-end.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts-backend)
- [API Reference](#api-reference)
- [First-Time Setup Checklist](#first-time-setup-checklist)
- [Known Limitations](#known-limitations--not-yet-built)

## Tech Stack

**Frontend:** React 18 (Vite), React Router, plain CSS (no framework)

**Backend:** Node.js, Express, MongoDB, Mongoose

**Auth:** JWT in an httpOnly cookie, bcrypt password hashing, Passport.js (real Google & Facebook OAuth)

**Payments:** Razorpay (order creation + server-side signature verification)

**Email:** Nodemailer (falls back to logging to the console if SMTP isn't configured, so password reset is testable without a mail server)

**Icons:** Font Awesome, via CDN

## Features

| Module | What it does |
|---|---|
| **Authentication** | Register/login with hashed passwords, JWT httpOnly cookie sessions, real Google & Facebook OAuth, forgot/reset password via email, mock email verification, 2FA toggle |
| **Movie/Content Management** | Full catalog in MongoDB (25 seeded titles), admin-only create/update/delete |
| **Search & Browse** | Text search, genre filter, movie/series type filter |
| **Watchlist & Watch History** | Add/remove titles, "Continue Watching" row, resumes playback from last position |
| **Ratings** | 1–5 star rating per user per title, live community average |
| **Subscription** | 3 tiers, real Razorpay checkout with server-side payment verification, cancel |
| **Admin Dashboard** | User management (promote/suspend/delete), movie catalog CRUD UI, platform analytics |
| **Password Reset** | Crypto-random token (hashed at rest, 30-min expiry), emailed or console-logged in dev |

## Project Structure

```
streamx/
├── backend/
│   ├── config/
│   │   ├── database.js          # Mongoose connection
│   │   └── passport.js          # Google/Facebook OAuth strategies
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── movieController.js
│   │   ├── ratingController.js
│   │   ├── subscriptionController.js
│   │   └── adminController.js
│   ├── data/
│   │   ├── seedMovies.js        # 25-title starter catalog
│   │   └── plans.js             # Subscription plan definitions (shared source of truth)
│   ├── middleware/
│   │   ├── authMiddleware.js    # protect() — verifies JWT
│   │   └── adminMiddleware.js   # adminOnly() — checks role
│   ├── models/
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Rating.js
│   │   └── Subscription.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js       # also hosts nested rating routes
│   │   ├── subscriptionRoutes.js
│   │   └── adminRoutes.js
│   ├── scripts/
│   │   ├── seed.js              # loads the movie catalog into MongoDB
│   │   └── promoteAdmin.js      # CLI: promote a user to admin by email
│   ├── utils/
│   │   └── sendEmail.js         # SMTP send, or console fallback
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/ (src/)
    ├── assets/
    ├── components/
    │   ├── Footer.jsx
    │   ├── MovieCard.jsx
    │   ├── MovieRow.jsx
    │   ├── Navbar.jsx
    │   ├── SearchBar.jsx
    │   └── VideoPlayer.jsx
    ├── context/
    │   └── AuthContext.jsx
    ├── pages/
    │   ├── Home.jsx
    │   ├── Landing.jsx / Landing.css
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── ForgotPassword.jsx
    │   ├── ResetPassword.jsx
    │   ├── MovieDetails.jsx
    │   ├── Search.jsx
    │   ├── Series.jsx
    │   ├── Watch.jsx
    │   ├── Watchlist.jsx
    │   ├── Profile.jsx
    │   ├── Subscription.jsx
    │   └── Admin.jsx
    ├── services/
    │   └── api.js                # all backend calls live here
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    └── index.html
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB — either running locally (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- npm

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values — see below
npm run seed               # loads the 25-title movie catalog into MongoDB
npm run dev                # starts the API on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend                # your Vite project root
npm install
```

Create a `.env` file in the frontend root:

```
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
npm run dev                # starts the app on http://localhost:5173
```

### First Admin Account

There's no UI path to create the first admin (by design — anyone shouldn't be able to self-promote). Register a normal account through the app, then from the `backend/` folder:

```bash
npm run promote your.email@example.com
```

Log out and back in — you'll see an "Admin" link in the navbar.

## Environment Variables

All of these live in `backend/.env` (see `backend/.env.example` for the template).

| Variable | Required? | Description |
|---|---|---|
| `PORT` | No (defaults 5000) | Port the API listens on |
| `NODE_ENV` | No | `development` or `production` — affects cookie security settings |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Long random string used to sign session tokens |
| `JWT_EXPIRES_IN` | No (defaults `7d`) | Session length |
| `CLIENT_ORIGIN` | **Yes** | Frontend URL — used for CORS and OAuth/email redirect links |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Optional | From Google Cloud Console — enables real Google login |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` / `FACEBOOK_CALLBACK_URL` | Optional | From Facebook Developers — enables real Facebook login |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Optional | Enables real password-reset emails; without these, reset links are logged to the console instead |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional | From Razorpay Dashboard (Test Mode keys while developing) — enables real subscription checkout |

Anything marked "Optional" degrades gracefully rather than crashing the server — you'll see a `console.warn` on startup, and the relevant feature (OAuth button, real email, checkout) returns a clear error/fallback instead of a 500.

## NPM Scripts (backend)

| Script | What it does |
|---|---|
| `npm start` | Runs the server (no auto-restart) |
| `npm run dev` | Runs the server with `nodemon` (auto-restarts on file changes) |
| `npm run seed` | Wipes and reloads the `movies` collection from `data/seedMovies.js` |
| `npm run promote <email>` | Promotes a registered user to `role: "admin"` |

## API Reference

Base URL: `http://localhost:5000/api`. Endpoints marked 🔒 require a valid session cookie; 🔒👑 require an admin session.

### Auth (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create an account |
| POST | `/login` | — | Email/password login |
| POST | `/logout` | — | Clears the session cookie |
| POST | `/forgot-password` | — | Requests a reset link (generic response either way) |
| POST | `/reset-password/:token` | — | Sets a new password, logs in on success |
| GET | `/google` | — | Starts Google OAuth (redirect) |
| GET | `/google/callback` | — | Google OAuth callback |
| GET | `/facebook` | — | Starts Facebook OAuth (redirect) |
| GET | `/facebook/callback` | — | Facebook OAuth callback |
| GET | `/me` | 🔒 | Current logged-in user |
| PUT | `/verify-email` | 🔒 | Marks the account's email as verified |
| PUT | `/change-password` | 🔒 | Changes password (requires current password) |
| PUT | `/profile` | 🔒 | Updates name/email/language/parental controls/notifications/2FA |
| POST | `/watchlist/:movieId` | 🔒 | Toggles a title in the watchlist |
| POST | `/history` | 🔒 | Saves/updates watch progress for a title |
| DELETE | `/history/:movieId` | 🔒 | Removes one title from watch history |
| DELETE | `/history` | 🔒 | Clears all watch history |
| PUT | `/subscription` | 🔒 | Legacy dummy-subscribe (no payment) — kept for local testing |

### Movies (`/movies`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all titles (`?type=movie\|series` to filter) |
| GET | `/search` | — | Search (`?query=&genre=&type=`) |
| GET | `/:id` | — | Get one title |
| GET | `/:id/related` | — | Titles sharing a genre |
| GET | `/:id/ratings` | — | Rating breakdown + average |
| GET | `/:id/rating/me` | 🔒 | Your own rating for this title |
| POST | `/:id/rating` | 🔒 | Submit/update your rating |
| DELETE | `/:id/rating` | 🔒 | Remove your rating |
| POST | `/` | 🔒👑 | Create a title |
| PUT | `/:id` | 🔒👑 | Update a title |
| DELETE | `/:id` | 🔒👑 | Delete a title |

### Subscriptions (`/subscriptions`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/plans` | — | List available plans |
| POST | `/checkout` | 🔒 | Creates a Razorpay order |
| POST | `/verify` | 🔒 | Verifies payment signature, activates the plan |
| GET | `/current` | 🔒 | Your active subscription record |
| POST | `/cancel` | 🔒 | Cancels your subscription |

### Admin (`/admin`) — all routes require 🔒👑

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users |
| PUT | `/users/:id` | Update a user's role or suspended status |
| DELETE | `/users/:id` | Delete a user |
| GET | `/analytics` | Platform-wide counts (users, movies, ratings, active subs, etc.) |

## First-Time Setup Checklist

- [ ] MongoDB running/reachable, `MONGO_URI` set
- [ ] `npm run seed` — loads the movie catalog
- [ ] Register an account, then `npm run promote <your-email>` for admin access
- [ ] *(Optional)* Google/Facebook OAuth credentials for real social login
- [ ] *(Optional)* SMTP credentials for real password-reset emails
- [ ] *(Optional)* Razorpay test keys for real subscription checkout

## Known Limitations / Not Yet Built

- **No Razorpay webhook.** Subscription activation depends on the browser successfully calling `/subscriptions/verify` after payment. A dropped connection between payment and that call means Razorpay has the money but the database never finds out. Production needs a webhook (`payment.captured`) as a second, server-side confirmation path.
- **No recurring billing.** Each "Choose Plan" click is a one-time charge. `renewalDate` is stored but nothing acts on it — there's no auto-renewal or re-charge when it passes.
- **No refund flow.**
- **Deleting a movie doesn't clean up references.** Ratings, watchlist entries, and history entries pointing at a deleted title's numeric id are left dangling rather than cascade-deleted.
- **Single demo video file.** All titles share the same sample `.mp4` — there's no real per-title video storage, transcoding, or adaptive streaming (HLS/DASH).
- **No rate limiting** on auth endpoints (login, register, forgot-password) — worth adding before any public deployment.
- **No automated tests.**
