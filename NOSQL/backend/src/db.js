// Handles the MongoDB connection using the official MongoDB Node.js driver.
// We create one client and reuse it across all routes — this is called
// connection pooling and avoids opening a new connection on every request.

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

let db = null;

// Connect to MongoDB Atlas and return the database instance.
// If already connected, returns the existing connection.
export async function connectDB() {
  if (db) return db;

  await client.connect();
  db = client.db('quickslot_reviews');
  console.log('Connected to MongoDB Atlas');
  return db;
}

// Returns the reviews collection directly — used in route handlers.
export async function getReviewsCollection() {
  const database = await connectDB();
  return database.collection('reviews');
}