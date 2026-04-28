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

## Resetting Dependencies

If you run into dependency issues:

```bash
npm run install:clean
```

This removes all `node_modules` and reinstalls from scratch.
