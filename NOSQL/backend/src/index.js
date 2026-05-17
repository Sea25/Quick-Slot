// Entry point for the QuickSlot NoSQL backend server.
// This is a separate Express server running on port 5001,
// completely independent from the SQL backend on port 5000.
// It connects to MongoDB Atlas instead of Supabase/PostgreSQL.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewRoutes from './routes/reviews.js';
import { connectDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check — also confirms MongoDB connection is working
app.get('/api/health', async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', database: 'MongoDB Atlas connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// Mount the reviews routes
app.use('/api/reviews', reviewRoutes);

// Connect to MongoDB first, then start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`QuickSlot NoSQL API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });