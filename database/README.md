# QUICKSLOT Database

PostgreSQL schema and seed data for Supabase (or any PostgreSQL host).

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → **New query**.
3. Paste and run `schema.sql`, then `seed.sql`.
4. Copy **Project URL** and **service_role** key (Settings → API) into `backend/.env`.

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Name + mobile login identity |
| `parking_lots` | Locations, rates, distance |
| `slots` | Individual spaces per lot |
| `bookings` | Reservations, payment, QR hash |
| `vehicles` | User vehicles (number, type, colour) |

## Double-booking protection

Trigger `trg_prevent_double_booking` blocks overlapping `start_time` / `end_time` on the same `slot_id` and `booking_date` when `payment_status` is not `cancelled`.

## ER relationships

- `users` 1 → N `bookings`
- `parking_lots` 1 → N `slots`
- `slots` 1 → N `bookings`
