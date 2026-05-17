-- ============================================================
-- STEP 2: Run this AFTER drop.sql
-- Creates all tables + sample data for QuickSlot
-- ============================================================

-- ------------------------------------------------------------
-- TABLE 1: users (login with name + mobile)
-- ------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE 2: vehicles (cars linked to a user)
-- user_id = FOREIGN KEY → links to users table
-- ------------------------------------------------------------
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE 3: parking_lots (parking places)
-- ------------------------------------------------------------
CREATE TABLE parking_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  distance_km DECIMAL(6, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE 4: slots (each parking space inside a lot)
-- lot_id = FOREIGN KEY → links to parking_lots table
-- ------------------------------------------------------------
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (lot_id, slot_number)
);

-- ------------------------------------------------------------
-- TABLE 5: bookings (reservations / tickets)
-- user_id → users,  slot_id → slots,  vehicle_id → vehicles
-- payment_status: pending, paid, or cancelled
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES slots(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  qr_code_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- ------------------------------------------------------------
-- RULE: stop two bookings on the same slot at the same time
-- (Trigger = automatic check before INSERT or UPDATE)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_slot_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM bookings
    WHERE slot_id = NEW.slot_id
      AND booking_date = NEW.booking_date
      AND payment_status <> 'cancelled'
      AND id <> NEW.id
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'This slot is already booked for that time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION prevent_slot_double_booking();

-- ------------------------------------------------------------
-- Sample data: 5 parking lots
-- ------------------------------------------------------------
INSERT INTO parking_lots (name, location_name, description, hourly_rate, distance_km)
VALUES
  ('Kochi Mall Parking', 'MG Road, Kochi', 'Covered parking with security and EV charging.', 45.00, 0.8),
  ('Tech Park Central', 'Kakkanad, Kochi', 'Parking for office workers with CCTV.', 35.00, 1.5),
  ('Marine Drive Plaza', 'Marine Drive, Kochi', 'Waterfront parking near the city.', 60.00, 2.2),
  ('Railway Station West', 'Ernakulam Junction', 'Parking near railway station.', 25.00, 3.0),
  ('Lulu Hypermarket Lot', 'Edappally, Kochi', 'Large parking area with wide bays.', 40.00, 4.5);

-- ------------------------------------------------------------
-- Sample data: 5 slots (A1, A2, B1, B2, C1) for EVERY parking lot
-- ------------------------------------------------------------
INSERT INTO slots (lot_id, slot_number, is_available)
SELECT id, 'A1', TRUE FROM parking_lots;

INSERT INTO slots (lot_id, slot_number, is_available)
SELECT id, 'A2', TRUE FROM parking_lots;

INSERT INTO slots (lot_id, slot_number, is_available)
SELECT id, 'B1', TRUE FROM parking_lots;

INSERT INTO slots (lot_id, slot_number, is_available)
SELECT id, 'B2', TRUE FROM parking_lots;

INSERT INTO slots (lot_id, slot_number, is_available)
SELECT id, 'C1', TRUE FROM parking_lots;

-- Refresh Supabase so the app sees the new tables (keep this line)
NOTIFY pgrst, 'reload schema';