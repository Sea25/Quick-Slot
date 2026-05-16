# QuickSlot Database

Only **2 files**. Run in Supabase **SQL Editor** in this order:

| Order | File | What it does |
|-------|------|----------------|
| 1 | `drop.sql` | Deletes all tables |
| 2 | `setup.sql` | Creates tables + sample data |

After running both: **Logout** in the app → **sign in again**.

---

## Tables (for viva)

| Table | Stores |
|-------|--------|
| `users` | Name, mobile number |
| `vehicles` | Car number, type, colour (linked to user) |
| `parking_lots` | Parking place name, rate, distance |
| `slots` | Each space in a lot (A1, B1, …) |
| `bookings` | Date, time, payment, QR code (links to `vehicles`) |

## Important words (simple meaning)

- **PRIMARY KEY** → unique ID for each row  
- **FOREIGN KEY** → links one table to another (e.g. `user_id` → `users`)  
- **REFERENCES** → which table the foreign key points to  
- **ON DELETE CASCADE** → if parent row is deleted, child rows are deleted too  
- **UNIQUE** → no duplicate values allowed in that column  
- **TRIGGER** → automatic rule that runs before save (stops double booking)  
- **INSERT** → add new rows (sample parking data)  
- **CHECK** → only allowed values (e.g. payment must be pending, paid, or cancelled)
