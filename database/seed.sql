-- Sample data for QUICKSLOT
-- Run after schema.sql

INSERT INTO parking_lots (name, location_name, description, hourly_rate, distance_km) VALUES
  (
    'Kochi Mall Parking',
    'MG Road, Kochi',
    'Multi-level covered parking with 24/7 security, EV charging bays, and direct mall elevator access.',
    45.00,
    0.8
  ),
  (
    'Tech Park Central',
    'Kakkanad, Kochi',
    'Open-air and basement slots ideal for office commuters. CCTV monitored with fast entry/exit lanes.',
    35.00,
    1.5
  ),
  (
    'Marine Drive Plaza',
    'Marine Drive, Kochi',
    'Prime waterfront location. Limited slots — pre-booking recommended on weekends.',
    60.00,
    2.2
  ),
  (
    'Railway Station West',
    'Ernakulam Junction',
    'Short-stay and long-stay zones near the main terminal. Perfect for travelers.',
    25.00,
    3.0
  ),
  (
    'Lulu Hypermarket Lot',
    'Edappally, Kochi',
    'High-capacity lot with wide bays. Family-friendly with trolley return points.',
    40.00,
    4.5
  );

-- Slots for each lot (5 slots per lot)
INSERT INTO slots (lot_id, slot_number, is_available)
SELECT pl.id, s.num, true
FROM parking_lots pl
CROSS JOIN (
  VALUES ('A1'), ('A2'), ('B1'), ('B2'), ('C1')
) AS s(num)
WHERE pl.name IN (
  'Kochi Mall Parking',
  'Tech Park Central',
  'Marine Drive Plaza',
  'Railway Station West',
  'Lulu Hypermarket Lot'
);
