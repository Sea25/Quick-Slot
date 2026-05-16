import { Router } from 'express';
import { supabase, isConfigured } from '../config/supabase.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { name, mobile_number } = req.body;

    if (!name?.trim() || !mobile_number?.trim()) {
      return res.status(400).json({ error: 'Name and mobile number are required' });
    }

    if (!isConfigured) {
      return res.status(503).json({ error: 'Database not configured. Set Supabase env variables.' });
    }

    const mobile = mobile_number.trim();

    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('mobile_number', mobile)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      return res.json({ user: existing, isNew: false });
    }

    const { data: created, error } = await supabase
      .from('users')
      .insert({ name: name.trim(), mobile_number: mobile })
      .select()
      .single();

    if (error) throw error;
    if (!created?.id) {
      return res.status(500).json({ error: 'Could not create user profile. Check database setup.' });
    }

    return res.json({ user: created, isNew: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/** Verify stored session still exists in database */
router.get('/session', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ valid: false, error: 'No session' });
    }

    if (!isConfigured) {
      return res.status(503).json({ valid: false, error: 'Database not configured' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, mobile_number')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        valid: false,
        error: 'Session expired. Please sign in again.',
        code: 'SESSION_INVALID',
      });
    }

    return res.json({ valid: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ valid: false, error: err.message });
  }
});

export default router;
