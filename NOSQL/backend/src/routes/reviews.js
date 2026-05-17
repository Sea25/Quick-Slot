// All CRUD routes for parking lot reviews.
// Each review is stored as a document in MongoDB — no fixed schema required.
// This means different reviews can have different fields, which is the
// key advantage of a NoSQL document database over a relational one.

import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getReviewsCollection } from '../db.js';

const router = Router();

// CREATE — POST /api/reviews
// Adds a new review document for a parking lot
router.post('/', async (req, res) => {
  try {
    const { lot_id, lot_name, reviewer_name, rating, comment } = req.body;

    if (!lot_id || !lot_name || !reviewer_name || !rating || !comment) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // This is a schema-less document — we can store any fields we want.
    // In a relational DB we would need to define all columns first.
    const review = {
      lot_id,
      lot_name,
      reviewer_name,
      rating: Number(rating),
      comment,
      created_at: new Date(),
    };

    const collection = await getReviewsCollection();
    const result = await collection.insertOne(review);

    return res.status(201).json({
      message: 'Review added',
      review: { ...review, _id: result.insertedId },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add review' });
  }
});

// READ ALL — GET /api/reviews
// Returns every review, sorted newest first
router.get('/', async (req, res) => {
  try {
    const collection = await getReviewsCollection();
    const reviews = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return res.json({ reviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// READ BY LOT — GET /api/reviews/lot/:lot_id
// Returns all reviews for a specific parking lot
router.get('/lot/:lot_id', async (req, res) => {
  try {
    const { lot_id } = req.params;
    const collection = await getReviewsCollection();

    const reviews = await collection
      .find({ lot_id })
      .sort({ created_at: -1 })
      .toArray();

    return res.json({ reviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// UPDATE — PUT /api/reviews/:id
// Updates the comment and rating of an existing review
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;

    if (!comment || !rating) {
      return res.status(400).json({ error: 'Comment and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const collection = await getReviewsCollection();

    // $set updates only the specified fields — other fields stay unchanged
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          comment,
          rating: Number(rating),
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json({ message: 'Review updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE — DELETE /api/reviews/:id
// Removes a review document from the collection
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await getReviewsCollection();

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;