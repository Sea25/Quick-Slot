# QUICKSLOT — Smart Car Parking System

Pre-book parking slots, pay (simulated), and get a digital ticket with QR code for check-in/check-out.

## Project structure

```
Quick-Slot/
├── database/     # PostgreSQL schema + seed (Supabase)
├── backend/      # Express API
└── frontend/     # React (Vite) UI
```

## Quick start

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `database/schema.sql` then `database/seed.sql` in the SQL Editor.
3. Copy **Project URL** and **service_role** key.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

API: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` to backend)

## User flow

1. **Auth** — Name + mobile (register or login)
2. **Dashboard** — Hero banner → search
3. **Search** — Date, time, duration → list lots (distance, rate)
4. **Lot detail** — Summary + **Continue to Pay**
5. **Payment** — Simulated pay → QR ticket
6. **My Tickets** — Upcoming / Past tabs, cancel active tickets
7. **Add Vehicle** — Register vehicle number, type, and colour

**Search flow:** Search form → separate **Results** page → lot detail → payment

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (Supabase) |

## DBMS highlights

- 5 tables with foreign keys: `users`, `vehicles`, `parking_lots`, `slots`, `bookings`

**Already set up the DB?** Run `database/migrations/002_vehicles.sql` in Supabase to add the vehicles table.
- Trigger prevents double-booking on overlapping times
- Relational JOIN for My Tickets (`bookings` → `slots` → `parking_lots`)

See `database/README.md` and the ER diagram in this file’s history for full schema docs.
