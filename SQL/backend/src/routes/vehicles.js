import { Router } from 'express';
import { supabase, isConfigured } from '../config/supabase.js';
import { validateUser, mapDbError } from '../middleware/validateUser.js';

const router = Router();

router.get('/', validateUser, async (req, res) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ vehicles: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: mapDbError(err) || 'Failed to load vehicles' });
  }
});

router.post('/', validateUser, async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, color } = req.body;

    if (!vehicle_number?.trim() || !vehicle_type?.trim() || !color?.trim()) {
      return res.status(400).json({ error: 'Vehicle number, type, and color are required' });
    }

    if (!isConfigured) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: req.userId,
        vehicle_number: vehicle_number.trim().toUpperCase(),
        vehicle_type: vehicle_type.trim(),
        color: color.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ vehicle: data });
  } catch (err) {
    console.error(err);
    const message = mapDbError(err);
    const status = message.includes('sign in') ? 401 : 500;
    return res.status(status).json({ error: message || 'Failed to add vehicle', code: status === 401 ? 'SESSION_INVALID' : undefined });
  }
});

export default router;