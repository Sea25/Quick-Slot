const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');  // ← Import from config
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ==================== TODAY'S REPORT ====================
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('parking_records')
            .select(`
                *,
                vehicles:vehicle_id (vehicle_number, owner_name, phone),
                slots:slot_id (slot_number),
                users:processed_by (name)
            `)
            .gte('entry_time', `${today} 00:00:00`)
            .lte('entry_time', `${today} 23:59:59`)
            .order('entry_time', { ascending: false });
        
        const { data: paidRecords } = await supabase
            .from('parking_records')
            .select('amount')
            .eq('payment_status', 'paid')
            .gte('entry_time', `${today} 00:00:00`)
            .lte('entry_time', `${today} 23:59:59`);
        
        const totalCollection = paidRecords?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        
        const formattedVehicles = (vehicles || []).map(v => ({
            id: v.id,
            vehicleNumber: v.vehicles?.vehicle_number,
            ownerName: v.vehicles?.owner_name,
            phone: v.vehicles?.phone,
            slotNumber: v.slots?.slot_number,
            entryTime: v.entry_time,
            exitTime: v.exit_time,
            amount: v.amount,
            paymentStatus: v.payment_status,
            processedBy: v.users?.name
        }));
        
        res.json({
            date: today,
            totalVehicles: vehicles?.length || 0,
            totalCollection: totalCollection,
            vehicles: formattedVehicles
        });
        
    } catch (error) {
        console.error('Today report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// ==================== WEEKLY REPORT ====================
router.get('/weekly', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data: records, error } = await supabase
            .from('parking_records')
            .select('entry_time, amount')
            .eq('payment_status', 'paid')
            .gte('entry_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        if (error) throw error;
        
        const grouped = {};
        records?.forEach(record => {
            const date = new Date(record.entry_time).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = { date, totalVehicles: 0, totalCollection: 0 };
            }
            grouped[date].totalVehicles++;
            grouped[date].totalCollection += record.amount || 0;
        });
        
        const weeklyReport = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
        
        res.json(weeklyReport);
        
    } catch (error) {
        console.error('Weekly report error:', error);
        res.status(500).json({ error: 'Failed to generate weekly report' });
    }
});

// ==================== MONTHLY REPORT ====================
router.get('/monthly', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data: records, error } = await supabase
            .from('parking_records')
            .select('entry_time, amount')
            .eq('payment_status', 'paid')
            .gte('entry_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (error) throw error;
        
        const grouped = {};
        records?.forEach(record => {
            const date = new Date(record.entry_time).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = { date, totalVehicles: 0, totalCollection: 0 };
            }
            grouped[date].totalVehicles++;
            grouped[date].totalCollection += record.amount || 0;
        });
        
        const monthlyReport = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
        
        res.json(monthlyReport);
        
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ error: 'Failed to generate monthly report' });
    }
});

module.exports = router;