-- Run if login or inserts fail due to Row Level Security
-- Backend uses service_role key which bypasses RLS, but this helps if policies were misconfigured

DROP POLICY IF EXISTS "Allow insert users" ON users;
CREATE POLICY "Allow insert users" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select users" ON users;
CREATE POLICY "Allow select users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert vehicles" ON vehicles;
CREATE POLICY "Allow insert vehicles" ON vehicles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select own vehicles" ON vehicles;
CREATE POLICY "Allow select own vehicles" ON vehicles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert bookings" ON bookings;
CREATE POLICY "Allow insert bookings" ON bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select bookings" ON bookings;
CREATE POLICY "Allow select bookings" ON bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update bookings" ON bookings;
CREATE POLICY "Allow update bookings" ON bookings FOR UPDATE USING (true);
