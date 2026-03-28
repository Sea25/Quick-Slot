const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');  // ← Import supabase from config
const { authenticateToken } = require('../middleware/auth');

// ==================== FEE CALCULATION ====================
function calculateFee(entryTime, exitTime, vehicleType) {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const durationMs = exit - entry;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    const rates = {
        bike: { firstHour: 10, additionalHour: 5 },
        car: { firstHour: 20, additionalHour: 10 },
        truck: { firstHour: 30, additionalHour: 15 }
    };
    
    const rate = rates[vehicleType] || rates.car;
    
    if (durationHours <= 1) {
        return rate.firstHour;
    } else {
        const additionalHours = Math.ceil(durationHours - 1);
        return rate.firstHour + (additionalHours * rate.additionalHour);
    }
}

// ==================== VEHICLE ENTRY ====================
router.post('/entry', authenticateToken, async (req, res) => {
    const { vehicleNumber, vehicleType, ownerName, phone } = req.body;
    
    if (!vehicleNumber || !vehicleType) {
        return res.status(400).json({ 
            error: 'Vehicle number and type are required' 
        });
    }

    try {
        // Check if vehicle exists
        let { data: vehicle } = await supabase
            .from('vehicles')
            .select('*')
            .eq('vehicle_number', vehicleNumber)
            .single();
        
        let vehicleId;
        
        if (!vehicle) {
            // Create new vehicle
            const { data: newVehicle, error: insertError } = await supabase
                .from('vehicles')
                .insert([{ 
                    vehicle_number: vehicleNumber, 
                    owner_name: ownerName || null, 
                    phone: phone || null,
                    created_by: req.user.id
                }])
                .select();
            
            if (insertError) {
                console.error('Vehicle creation error:', insertError);
                return res.status(500).json({ 
                    error: 'Failed to create vehicle record' 
                });
            }
            vehicleId = newVehicle[0].id;
        } else {
            vehicleId = vehicle.id;
        }
        
        // Find free slot
        const { data: freeSlots, error: slotError } = await supabase
            .from('slots')
            .select('*')
            .eq('status', 'free')
            .eq('vehicle_type', vehicleType)
            .limit(1);
        
        if (!freeSlots || freeSlots.length === 0) {
            return res.status(400).json({ 
                error: 'No free slots available for this vehicle type' 
            });
        }
        
        const slot = freeSlots[0];
        const entryTime = new Date();
        
        // Create parking record
        const { data: parkingRecord, error: parkError } = await supabase
            .from('parking_records')
            .insert([{
                vehicle_id: vehicleId,
                slot_id: slot.id,
                entry_time: entryTime,
                processed_by: req.user.id
            }])
            .select();
        
        if (parkError) {
            console.error('Parking record error:', parkError);
            return res.status(500).json({ 
                error: 'Failed to create parking record' 
            });
        }
        
        // Update slot status
        await supabase
            .from('slots')
            .update({ status: 'occupied' })
            .eq('id', slot.id);
        
        res.json({
            success: true,
            parkingId: parkingRecord[0].id,
            slotNumber: slot.slot_number,
            entryTime: entryTime,
            message: `Vehicle ${vehicleNumber} parked at slot ${slot.slot_number}`
        });
        
    } catch (error) {
        console.error('Entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== GET ACTIVE SESSION ====================
router.get('/active/:vehicleNumber', authenticateToken, async (req, res) => {
    const { vehicleNumber } = req.params;
    
    try {
        // Get vehicle
        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('vehicle_number', vehicleNumber)
            .single();
        
        if (!vehicle) {
            return res.status(404).json({ 
                error: 'Vehicle not found' 
            });
        }
        
        // Get active parking record
        const { data: record, error: recordError } = await supabase
            .from('parking_records')
            .select(`
                *,
                vehicles:vehicle_id (vehicle_number, owner_name, phone),
                slots:slot_id (slot_number, vehicle_type)
            `)
            .eq('vehicle_id', vehicle.id)
            .is('exit_time', null)
            .single();
        
        if (!record) {
            return res.status(404).json({ 
                error: 'No active parking session found' 
            });
        }
        
        // Calculate current amount
        const currentTime = new Date();
        const amount = calculateFee(
            record.entry_time, 
            currentTime, 
            record.slots.vehicle_type
        );
        
        res.json({
            id: record.id,
            vehicleNumber: record.vehicles.vehicle_number,
            ownerName: record.vehicles.owner_name,
            phone: record.vehicles.phone,
            slotNumber: record.slots.slot_number,
            entryTime: record.entry_time,
            currentTime: currentTime,
            amount: amount
        });
        
    } catch (error) {
        console.error('Active session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== PROCESS EXIT ====================
router.post('/exit/:parkingId', authenticateToken, async (req, res) => {
    const { parkingId } = req.params;
    const { amount } = req.body;
    
    try {
        // Get parking record with slot info
        const { data: record, error: recordError } = await supabase
            .from('parking_records')
            .select(`
                *,
                slots:slot_id (id, slot_number, vehicle_type),
                vehicles:vehicle_id (vehicle_number)
            `)
            .eq('id', parkingId)
            .single();
        
        if (!record) {
            return res.status(404).json({ 
                error: 'Parking record not found' 
            });
        }
        
        if (record.exit_time) {
            return res.status(400).json({ 
                error: 'Vehicle already exited' 
            });
        }
        
        const exitTime = new Date();
        
        // Update parking record
        await supabase
            .from('parking_records')
            .update({
                exit_time: exitTime,
                amount: amount,
                payment_status: 'paid',
                processed_by: req.user.id
            })
            .eq('id', parkingId);
        
        // Free up the slot
        await supabase
            .from('slots')
            .update({ status: 'free' })
            .eq('id', record.slots.id);
        
        res.json({
            success: true,
            message: 'Exit processed successfully',
            vehicleNumber: record.vehicles.vehicle_number,
            slotNumber: record.slots.slot_number,
            entryTime: record.entry_time,
            exitTime: exitTime,
            amount: amount
        });
        
    } catch (error) {
        console.error('Exit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== VEHICLE HISTORY ====================
router.get('/history/:vehicleNumber', authenticateToken, async (req, res) => {
    const { vehicleNumber } = req.params;
    
    try {
        // Get vehicle
        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('vehicle_number', vehicleNumber)
            .single();
        
        if (!vehicle) {
            return res.json([]);
        }
        
        // Get all parking records
        const { data: records } = await supabase
            .from('parking_records')
            .select(`
                *,
                slots:slot_id (slot_number)
            `)
            .eq('vehicle_id', vehicle.id)
            .order('entry_time', { ascending: false });
        
        const formattedRecords = (records || []).map(record => ({
            id: record.id,
            slotNumber: record.slots.slot_number,
            entryTime: record.entry_time,
            exitTime: record.exit_time,
            amount: record.amount,
            paymentStatus: record.payment_status
        }));
        
        res.json(formattedRecords);
        
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;