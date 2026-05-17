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

// Delete a vehicle by ID (only the owner can delete their own vehicle)
router.delete('/:id', validateUser, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isConfigured) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // First check the vehicle belongs to this user
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Delete the vehicle record from the database
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;

    return res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to delete vehicle' });
  }
});

export default router;