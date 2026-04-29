# Parkly

A peer-to-peer parking marketplace where drivers can find and book parking spots from local providers.

## Team

| Name | GitHub |
|---|---|
| Aryan Patil | aryanpatil |
| Ishan Kinikar | IshanKinikar |
| Zachary Albandar | zalbandar-dev |
| Nishant Nambiar | nishant-nambiar |
| Shankar Shivnath | SShankar15 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, TypeScript |
| Backend | Node.js, Express 4 |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Maps | Geoapify Autocomplete API |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

Check your versions:

```bash
node -v
npm -v
```

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/zalbandar-dev/cs-320-team-7.git
cd cs-320-team-7
```

### 2. Install dependencies

From the **root** of the repo (installs both frontend and backend):

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in the values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_secret_key
GEOAPIFY_KEY=your_geoapify_api_key
JWT_SECRET=any_long_random_string
PORT=3001
```

> Contact a team member for the actual Supabase credentials — do not commit `.env` to Git.

---

## Running the App

Run **both** frontend and backend together from the root:

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express API) | http://localhost:3001 |

Or run them separately:

```bash
# Frontend only
cd parkify && npm run dev

# Backend only
cd backend && npm run dev
```

---

## Running Tests

From the root:

```bash
npm run test
```

Tests are in `backend/src/tests/` and use Jest + Supertest. They cover auth, bookings, notifications, service requests, and database connections.

---

## Project Structure

```
cs-320-team-7/
├── parkify/                      # Next.js frontend
│   ├── app/
│   │   ├── api/                  # Next.js API routes (proxy to backend)
│   │   ├── components/           # Reusable UI components
│   │   ├── homepage/             # Main listing/search page
│   │   ├── bookings/             # User bookings view
│   │   ├── my-listings/          # Provider spot management
│   │   ├── account/              # User account & settings
│   │   ├── support/              # Support & FAQ page
│   │   └── lib/                  # Types, auth helpers
│   └── package.json
├── backend/                      # Express REST API
│   ├── src/
│   │   ├── server.js             # Entry point (port 3001)
│   │   ├── routes/               # auth, bookings, spots, payments, etc.
│   │   ├── utils/                # Shared helper functions
│   │   └── tests/                # Jest test suite
│   ├── .env.example              # Environment variable template
│   └── package.json
├── pdf_assignments/              # Course assignment submissions
├── software_metric_submissions/  # Software metrics submissions
├── package.json                  # Root workspace (runs both services)
└── README.md
```

---

## Key Features

- Browse and search parking spots by location with address autocomplete
- Book spots with date/time selection and real-time availability
- Provider dashboard to list, manage, and confirm or reject bookings
- Reviews after completed bookings
- JWT authentication with secure logout and token blacklisting
- Account management including profile editing and deactivation

---

## Database Setup (Supabase)

Parkly uses **Supabase** (hosted PostgreSQL) as its database. The Express backend holds the single shared Supabase client — the Next.js frontend never talks to Supabase directly; it only calls the Express API on port 3001.

### Connection

The client is initialized once in `backend/src/server.js` and shared across all route handlers via `app.set('supabase', ...)`:

```js
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
app.set('supabase', supabase);
```

`SUPABASE_URL` and `SUPABASE_KEY` (the **service-role** secret key, not the anon key) must be set in `backend/.env`. Contact a team member for the real values — they are not committed to Git.

### Tables

| Table | Purpose |
|---|---|
| `users` | Registered accounts (username, email, hashed password, role) |
| `parking_spots` | Spot listings created by providers (address, price, availability) |
| `bookings` | Reservations linking a driver to a spot with date/time range |
| `reviews` | Post-booking ratings and comments left by drivers |
| `notifications` | In-app notifications sent to users (booking updates, confirmations) |
| `service_requests` | Support tickets / help requests submitted by users |
| `jwt_blacklist` | Invalidated JWT tokens (populated on logout for secure token revocation) |

> All tables must exist in your Supabase project before running the app. Ask a team member for the SQL migration script or access to the shared project.

### Row-Level Security (RLS)

The backend authenticates with the **service-role key**, which bypasses Supabase RLS entirely. All access control is enforced in the Express route handlers and the `verifyToken` middleware (`backend/src/utils/verifyToken.js`), not at the database layer.

### Auth Flow

1. `POST /api/register` — creates a row in `users` with a bcrypt-hashed password.
2. `POST /api/login` — verifies credentials, returns a signed JWT.
3. Protected routes use `verifyToken` middleware, which validates the JWT and checks that it has not been added to `jwt_blacklist`.
4. `POST /api/logout` — inserts the current token into `jwt_blacklist`, making it permanently invalid.

---

## Resetting Dependencies

If you run into dependency issues:

```bash
npm run install:clean
```

This removes all `node_modules` and reinstalls from scratch.
