// Entry point for the QuickSlot Express server
// Loads environment variables, registers middleware, and mounts all route handlers

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import parkingRoutes from './routes/parking.js';
import bookingRoutes from './routes/bookings.js';
import vehicleRoutes from './routes/vehicles.js';
import { isConfigured } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow cross-origin requests from the React frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Simple health check endpoint — useful for deployment checks
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: isConfigured ? 'connected' : 'not configured' });
});

// Route handlers for each resource
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.listen(PORT, () => {
  console.log(`QuickSlot API running on http://localhost:${PORT}`);
});