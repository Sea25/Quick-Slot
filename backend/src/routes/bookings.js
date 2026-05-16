import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isConfigured } from '../config/supabase.js';
import { addHoursToTime } from '../utils/time.js';
import { validateUser, mapDbError } from '../middleware/validateUser.js';

const router = Router();

router.post('/', validateUser, async (req, res) => {
  try {
    const { lot_id, vehicle_id, booking_date, start_time, duration_hours } = req.body;

    if (!lot_id || !vehicle_id || !booking_date || !start_time || !duration_hours) {
      return res.status(400).json({ error: 'Please select a vehicle and fill all booking details' });
    }

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicle_id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!vehicle) {
      return res.status(400).json({ error: 'Selected vehicle not found. Add a vehicle first.' });
    }

    if (!isConfigured) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const start = start_time.length === 5 ? `${start_time}:00` : start_time;
    const end_time = addHoursToTime(start, parseInt(duration_hours, 10));

    const { data: lot } = await supabase
      .from('parking_lots')
      .select('hourly_rate')
      .eq('id', lot_id)
      .single();

    if (!lot) return res.status(404).json({ error: 'Lot not found' });

    const total_amount = Number(lot.hourly_rate) * parseInt(duration_hours, 10);

    const { data: slots } = await supabase.from('slots').select('id').eq('lot_id', lot_id);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_id, start_time, end_time')
      .eq('booking_date', booking_date)
      .neq('payment_status', 'cancelled');

    const bookedIds = new Set();
    for (const b of bookings || []) {
      if (b.start_time < end_time && start < b.end_time) {
        bookedIds.add(b.slot_id);
      }
    }

    const freeSlot = (slots || []).find((s) => !bookedIds.has(s.id));
    if (!freeSlot) {
      return res.status(409).json({ error: 'No slots available' });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: req.userId,
        vehicle_id,
        slot_id: freeSlot.id,
        booking_date,
        start_time: start,
        end_time,
        total_amount,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('already booked')) {
        return res.status(409).json({ error: 'Slot conflict — try again' });
      }
      throw error;
    }

    return res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    const message = mapDbError(err);
    const status = message.includes('sign in') ? 401 : 500;
    return res.status(status).json({ error: message || 'Booking failed', code: status === 401 ? 'SESSION_INVALID' : undefined });
  }
});

router.post('/:id/pay', validateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const qr_code_hash = `QS-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ payment_status: 'paid', qr_code_hash })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    return res.json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Payment failed' });
  }
});

/** JOIN: bookings + slots + parking_lots for My Tickets */
router.get('/my-tickets', validateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        booking_date,
        start_time,
        end_time,
        total_amount,
        payment_status,
        qr_code_hash,
        created_at,
        vehicles (
          vehicle_number,
          vehicle_type,
          color
        ),
        slots (
          slot_number,
          parking_lots (
            id,
            name,
            location_name,
            hourly_rate
          )
        )
      `
      )
      .eq('user_id', req.userId)
      .in('payment_status', ['paid', 'cancelled'])
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) throw error;

    const tickets = (data || []).map((b) => ({
      id: b.id,
      booking_date: b.booking_date,
      start_time: b.start_time,
      end_time: b.end_time,
      total_amount: b.total_amount,
      payment_status: b.payment_status,
      qr_code_hash: b.qr_code_hash,
      slot_number: b.slots?.slot_number,
      lot_name: b.slots?.parking_lots?.name,
      location_name: b.slots?.parking_lots?.location_name,
      vehicle_number: b.vehicles?.vehicle_number,
      vehicle_type: b.vehicles?.vehicle_type,
      vehicle_color: b.vehicles?.color,
    }));

    return res.json({ tickets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to load tickets' });
  }
});

router.patch('/:id/cancel', validateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('bookings')
      .select('id, payment_status, booking_date, end_time')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existing.payment_status === 'cancelled') {
      return res.status(400).json({ error: 'Ticket already cancelled' });
    }

    if (existing.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Only paid tickets can be cancelled' });
    }

    const endTime =
      existing.end_time?.length === 5 ? `${existing.end_time}:00` : existing.end_time;
    const endDt = new Date(`${existing.booking_date}T${endTime}`);
    if (endDt <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel an expired ticket' });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ payment_status: 'cancelled', qr_code_hash: null })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    return res.json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Cancellation failed' });
  }
});

export default router;
