import { Router } from 'express';
import { supabase, isConfigured } from '../config/supabase.js';
import { addHoursToTime } from '../utils/time.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { date, startTime, duration } = req.query;

    if (!date || !startTime || !duration) {
      return res.status(400).json({ error: 'date, startTime, and duration are required' });
    }

    if (!isConfigured) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const durationHours = parseInt(duration, 10);
    if (Number.isNaN(durationHours) || durationHours < 1) {
      return res.status(400).json({ error: 'duration must be at least 1 hour' });
    }

    const endTime = addHoursToTime(startTime.length === 5 ? `${startTime}:00` : startTime, durationHours);

    const { data: lots, error: lotsError } = await supabase
      .from('parking_lots')
      .select('*')
      .order('distance_km', { ascending: true });

    if (lotsError) throw lotsError;

    const { data: slots } = await supabase.from('slots').select('id, lot_id');

    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_id, start_time, end_time')
      .eq('booking_date', date)
      .neq('payment_status', 'cancelled');

    const bookedSlotIds = new Set();
    const start = startTime.length === 5 ? `${startTime}:00` : startTime;

    for (const b of bookings || []) {
      if (b.start_time < endTime && start < b.end_time) {
        bookedSlotIds.add(b.slot_id);
      }
    }

    const slotsByLot = {};
    for (const s of slots || []) {
      if (!slotsByLot[s.lot_id]) slotsByLot[s.lot_id] = [];
      slotsByLot[s.lot_id].push(s);
    }

    const results = (lots || [])
      .map((lot) => {
        const lotSlots = slotsByLot[lot.id] || [];
        const freeCount = lotSlots.filter((s) => !bookedSlotIds.has(s.id)).length;
        return {
          ...lot,
          available_slots: freeCount,
          has_availability: freeCount > 0,
        };
      })
      .filter((lot) => lot.has_availability);

    return res.json({ lots: results, meta: { date, startTime: start, endTime, durationHours } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
});

router.get('/:lotId', async (req, res) => {
  try {
    const { lotId } = req.params;

    const { data: lot, error } = await supabase
      .from('parking_lots')
      .select('*')
      .eq('id', lotId)
      .single();

    if (error) throw error;
    if (!lot) return res.status(404).json({ error: 'Parking lot not found' });

    const { data: slots } = await supabase
      .from('slots')
      .select('*')
      .eq('lot_id', lotId)
      .order('slot_number');

    return res.json({ lot, slots: slots || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to load lot' });
  }
});

router.get('/:lotId/available-slot', async (req, res) => {
  try {
    const { lotId } = req.params;
    const { date, startTime, duration } = req.query;

    if (!date || !startTime || !duration) {
      return res.status(400).json({ error: 'date, startTime, and duration are required' });
    }

    const durationHours = parseInt(duration, 10);
    const endTime = addHoursToTime(startTime.length === 5 ? `${startTime}:00` : startTime, durationHours);
    const start = startTime.length === 5 ? `${startTime}:00` : startTime;

    const { data: slots } = await supabase.from('slots').select('*').eq('lot_id', lotId);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_id, start_time, end_time')
      .eq('booking_date', date)
      .neq('payment_status', 'cancelled');

    const bookedIds = new Set();
    for (const b of bookings || []) {
      if (b.start_time < endTime && start < b.end_time) {
        bookedIds.add(b.slot_id);
      }
    }

    const available = (slots || []).find((s) => !bookedIds.has(s.id));
    if (!available) {
      return res.status(409).json({ error: 'No slots available for this time' });
    }

    return res.json({ slot: available, endTime, totalAmount: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Availability check failed' });
  }
});

export default router;