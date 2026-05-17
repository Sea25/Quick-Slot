import { supabase, isConfigured } from '../config/supabase.js';

export async function validateUser(req, res, next) {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Not logged in. Please sign in again.' });
  }

  if (!isConfigured) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, mobile_number')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not verify your session' });
  }

  if (!user) {
    return res.status(401).json({
      error: 'Your session is invalid or expired. Please log out and sign in again.',
      code: 'SESSION_INVALID',
    });
  }

  req.userId = user.id;
  req.user = user;
  next();
}

export function mapDbError(err) {
  const msg = err?.message || '';
  if (msg.includes('violates foreign key constraint') && msg.includes('user_id')) {
    return 'Your session is invalid. Please log out and sign in again.';
  }
  return msg || 'Something went wrong';
}
