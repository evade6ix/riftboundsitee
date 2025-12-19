'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Card = require('./models/Card');

const app = express();

// Railway sets PORT; default 3000 locally
const PORT = process.env.PORT || 3000;

// Use env var for MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/riftbound_local';

app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
mongoose
  .connect(mongoUri, { maxPoolSize: 10 })
  .then(() => {
    console.log('[Mongo] Connected successfully');
  })
  .catch((err) => {
    console.error('[Mongo] Connection error:', err.message);
  });

// --- Health / root routes ---
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Riftbound API root'
  });
});

app.get('/health', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1; // 1 = connected
  res.json({
    status: 'ok',
    mongoConnected: mongoReady
  });
});

// --- /cards list endpoint ---
// GET /cards?page=1&limit=20&search=annie
app.get('/cards', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || '').trim();

    const query = { game: 'riftbound' };

    if (search) {
      const regex = new RegExp(search, 'i'); // case-insensitive
      query.$or = [
        { name: regex },
        { cleanName: regex },
        { code: regex }
      ];
    }

    const [total, cards] = await Promise.all([
      Card.countDocuments(query),
      Card.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    res.json({
      page,
      limit,
      total,
      totalPages,
      data: cards
    });
  } catch (err) {
    console.error('[GET /cards] Error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch cards'
    });
  }
});
// --- /cards/:remoteId single card endpoint ---
app.get('/cards/:remoteId', async (req, res) => {
  try {
    const { remoteId } = req.params;

    const card = await Card.findOne({
      game: 'riftbound',
      remoteId
    }).lean();

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(card);
  } catch (err) {
    console.error('[GET /cards/:remoteId] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log('[Server] Listening on port ' + PORT);
});
