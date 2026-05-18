-- ============================================================
-- QUICKSLOT - Smart Car Parking System
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
  type TEXT DEFAULT 'regular' CHECK (type IN ('regular', 'premium', 'disabled')),
  level TEXT DEFAULT 'Ground Floor',
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


-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- ------------------------------------------------------------
-- TRIGGER 1: Prevent double booking on same slot + time
-- Also auto-updates is_available on the slot
-- (Runs automatically BEFORE every INSERT or UPDATE on bookings)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_slot_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping active bookings on the same slot
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

  -- Mark slot as unavailable when a new booking is made or updated to paid/pending
  IF NEW.payment_status <> 'cancelled' THEN
    UPDATE slots SET is_available = FALSE WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION prevent_slot_double_booking();

-- ------------------------------------------------------------
-- TRIGGER 2: Auto-restore slot availability when booking is cancelled
-- (Runs automatically AFTER UPDATE on bookings)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION restore_slot_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is cancelled, check if any other active bookings
  -- exist for that slot on that date. If none, mark slot as available.
  IF NEW.payment_status = 'cancelled' AND OLD.payment_status <> 'cancelled' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM bookings
      WHERE slot_id = NEW.slot_id
        AND booking_date = NEW.booking_date
        AND payment_status <> 'cancelled'
        AND id <> NEW.id
    ) THEN
      UPDATE slots SET is_available = TRUE WHERE id = NEW.slot_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_slot_on_cancel
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION restore_slot_on_cancel();


-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- ------------------------------------------------------------
-- Sample data: 5 parking lots
-- ------------------------------------------------------------
INSERT INTO parking_lots (name, location_name, description, hourly_rate, distance_km)
VALUES
  ('Kochi Mall Parking',    'MG Road, Kochi',       'Covered parking with security and EV charging.', 45.00, 0.8),
  ('Tech Park Central',     'Kakkanad, Kochi',       'Parking for office workers with CCTV.',          35.00, 1.5),
  ('Marine Drive Plaza',    'Marine Drive, Kochi',   'Waterfront parking near the city.',              60.00, 2.2),
  ('Railway Station West',  'Ernakulam Junction',    'Parking near railway station.',                  25.00, 3.0),
  ('Lulu Hypermarket Lot',  'Edappally, Kochi',      'Large parking area with wide bays.',             40.00, 4.5);

-- ------------------------------------------------------------
-- Sample data: 10 slots for EVERY parking lot
-- A1-A5 (top row), B1-B5 (bottom row)
-- ------------------------------------------------------------
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'A1', 'regular', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'A2', 'regular', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'A3', 'premium', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'A4', 'disabled', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'A5', 'regular', 'Ground Floor', TRUE FROM parking_lots;

INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'B1', 'regular', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'B2', 'regular', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'B3', 'premium', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'B4', 'disabled', 'Ground Floor', TRUE FROM parking_lots;
INSERT INTO slots (lot_id, slot_number, type, level, is_available) SELECT id, 'B5', 'regular', 'Ground Floor', TRUE FROM parking_lots;

-- ------------------------------------------------------------
-- Sample data: 2 users
-- ------------------------------------------------------------
INSERT INTO users (name, mobile_number)
VALUES
  ('Arun Kumar',   '9876543210'),
  ('Sneha Menon',  '9123456780');

-- ------------------------------------------------------------
-- Sample data: 2 vehicles (one per user)
-- ------------------------------------------------------------
INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, color)
VALUES
  ((SELECT id FROM users WHERE mobile_number = '9876543210'), 'KL07AB1234', 'Car',  'White'),
  ((SELECT id FROM users WHERE mobile_number = '9123456780'), 'KL09CD5678', 'SUV',  'Black');

-- ------------------------------------------------------------
-- Sample data: 2 bookings
-- ------------------------------------------------------------
INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, start_time, end_time, total_amount, payment_status, qr_code_hash)
VALUES (
  (SELECT id FROM users WHERE mobile_number = '9876543210'),
  (SELECT id FROM vehicles WHERE vehicle_number = 'KL07AB1234'),
  (SELECT s.id FROM slots s JOIN parking_lots p ON s.lot_id = p.id
   WHERE p.name = 'Kochi Mall Parking' AND s.slot_number = 'A1' LIMIT 1),
  CURRENT_DATE,
  '10:00', '12:00',
  90.00,
  'paid',
  'QR-ARUN-001'
);

INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_date, start_time, end_time, total_amount, payment_status, qr_code_hash)
VALUES (
  (SELECT id FROM users WHERE mobile_number = '9123456780'),
  (SELECT id FROM vehicles WHERE vehicle_number = 'KL09CD5678'),
  (SELECT s.id FROM slots s JOIN parking_lots p ON s.lot_id = p.id
   WHERE p.name = 'Tech Park Central' AND s.slot_number = 'B1' LIMIT 1),
  CURRENT_DATE,
  '09:00', '11:00',
  70.00,
  'pending',
  'QR-SNEHA-001'
);


-- ============================================================
-- DEMO QUERIES (DDL + DML)
-- ============================================================

-- ------------------------------------------------------------
-- DDL: Show all tables (PostgreSQL system catalog)
-- ------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- ------------------------------------------------------------
-- DML: SELECT — View all parking lots sorted by distance
-- ------------------------------------------------------------
SELECT name, location_name, hourly_rate, distance_km
FROM parking_lots
ORDER BY distance_km ASC;


-- ------------------------------------------------------------
-- DML: SELECT with JOIN — All bookings with full details
-- (user name, vehicle, slot, lot name, time, amount)
-- ------------------------------------------------------------
SELECT
  u.name          AS user_name,
  u.mobile_number,
  v.vehicle_number,
  v.vehicle_type,
  p.name          AS parking_lot,
  p.location_name,
  s.slot_number,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.total_amount,
  b.payment_status
FROM bookings b
JOIN users        u ON b.user_id    = u.id
JOIN vehicles     v ON b.vehicle_id = v.id
JOIN slots        s ON b.slot_id    = s.id
JOIN parking_lots p ON s.lot_id     = p.id
ORDER BY b.booking_date, b.start_time;


-- ------------------------------------------------------------
-- DML: SELECT with JOIN — Bookings for a specific user (by mobile)
-- ------------------------------------------------------------
SELECT
  b.booking_date,
  b.start_time,
  b.end_time,
  p.name     AS parking_lot,
  s.slot_number,
  b.total_amount,
  b.payment_status
FROM bookings b
JOIN users        u ON b.user_id = u.id
JOIN slots        s ON b.slot_id = s.id
JOIN parking_lots p ON s.lot_id  = p.id
WHERE u.mobile_number = '9876543210'
ORDER BY b.booking_date DESC;


-- ------------------------------------------------------------
-- DML: SELECT — Available slots in a specific parking lot
-- ------------------------------------------------------------
SELECT
  p.name AS parking_lot,
  s.slot_number,
  s.is_available
FROM slots s
JOIN parking_lots p ON s.lot_id = p.id
WHERE p.name = 'Kochi Mall Parking'
  AND s.is_available = TRUE
ORDER BY s.slot_number;


-- ------------------------------------------------------------
-- DML: SELECT with Aggregate — Total revenue per parking lot
-- ------------------------------------------------------------
SELECT
  p.name AS parking_lot,
  COUNT(b.id)          AS total_bookings,
  SUM(b.total_amount)  AS total_revenue
FROM bookings b
JOIN slots        s ON b.slot_id = s.id
JOIN parking_lots p ON s.lot_id  = p.id
WHERE b.payment_status = 'paid'
GROUP BY p.name
ORDER BY total_revenue DESC;


-- ------------------------------------------------------------
-- DML: UPDATE — Mark a booking as paid
-- ------------------------------------------------------------
UPDATE bookings
SET payment_status = 'paid'
WHERE qr_code_hash = 'QR-SNEHA-001';


-- ------------------------------------------------------------
-- DML: UPDATE — Change a user's mobile number
-- ------------------------------------------------------------
UPDATE users
SET mobile_number = '9000000001'
WHERE name = 'Arun Kumar';


-- ------------------------------------------------------------
-- DML: DELETE — Remove a cancelled booking
-- ------------------------------------------------------------
DELETE FROM bookings
WHERE payment_status = 'cancelled'
  AND booking_date < CURRENT_DATE;


-- ------------------------------------------------------------
-- DDL: DROP TABLE example (run only to reset/clean up)
-- Drops in correct order to respect foreign key constraints
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS bookings;
-- DROP TABLE IF EXISTS vehicles;
-- DROP TABLE IF EXISTS slots;
-- DROP TABLE IF EXISTS parking_lots;
-- DROP TABLE IF EXISTS users;


-- ============================================================
-- Notify Supabase PostgREST to reload schema
-- ============================================================
NOTIFY pgrst, 'reload schema';