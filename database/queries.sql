-- Example relational JOIN for My Tickets (used by backend API)
SELECT
  b.id,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.total_amount,
  b.qr_code_hash,
  s.slot_number,
  pl.name AS lot_name,
  pl.location_name
FROM bookings b
JOIN slots s ON b.slot_id = s.id
JOIN parking_lots pl ON s.lot_id = pl.id
WHERE b.user_id = 'YOUR-USER-UUID'
  AND b.payment_status = 'paid'
ORDER BY b.booking_date DESC, b.start_time DESC;
