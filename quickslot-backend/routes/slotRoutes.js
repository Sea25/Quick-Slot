const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');  // ← Import from config
const { authenticateToken } = require('../middleware/auth');

// ==================== GET ALL SLOTS ====================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data: slots, error } = await supabase
            .from('slots')
            .select('*')
            .order('slot_number', { ascending: true });
        
        if (error) throw error;
        
        res.json(slots);
        
    } catch (error) {
        console.error('Get slots error:', error);
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

// ==================== GET SLOT STATUS ====================
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const { count: freeCount, error: freeError } = await supabase
            .from('slots')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'free');
        
        const { count: occupiedCount, error: occupiedError } = await supabase
            .from('slots')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'occupied');
        
        const { count: totalCount, error: totalError } = await supabase
            .from('slots')
            .select('*', { count: 'exact', head: true });
        
        res.json({
            free: freeCount || 0,
            occupied: occupiedCount || 0,
            total: totalCount || 0,
            freePercentage: totalCount ? ((freeCount || 0) / totalCount * 100).toFixed(1) : 0
        });
        
    } catch (error) {
        console.error('Slot status error:', error);
        res.status(500).json({ error: 'Failed to fetch slot status' });
    }
});

// ==================== GET SLOTS BY TYPE ====================
router.get('/type/:vehicleType', authenticateToken, async (req, res) => {
    const { vehicleType } = req.params;
    
    try {
        const { data: slots, error } = await supabase
            .from('slots')
            .select('*')
            .eq('vehicle_type', vehicleType)
            .order('slot_number', { ascending: true });
        
        if (error) throw error;
        
        res.json(slots);
        
    } catch (error) {
        console.error('Get slots by type error:', error);
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

module.exports = router;