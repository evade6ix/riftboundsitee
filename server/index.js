'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Card = require('./models/Card');

const app = express();
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/riftbound_local';
const isProd = process.env.NODE_ENV === 'production';

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

// --- Health route (for Railway monitoring) ---
app.get('/health', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1; // 1 = connected
  res.json({
    status: 'ok',
    mongoConnected: mongoReady,
  });
});

// --- API: list cards ---
// GET /cards?page=1&limit=20&search=annie
app.get('/cards', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || '').trim();

    const query = { game: 'riftbound' };

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { cleanName: regex },
        { code: regex },
      ];
    }

    const [total, cards] = await Promise.all([
      Card.countDocuments(query),
      Card.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    res.json({
      page,
      limit,
      total,
      totalPages,
      data: cards,
    });
  } catch (err) {
    console.error('[GET /cards] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// --- API: single card by remoteId ---
app.get('/cards/:remoteId', async (req, res) => {
  try {
    const remoteId = req.params.remoteId;

    const card = await Card.findOne({
      game: 'riftbound',
      remoteId,
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

// --- Static client (production only) ---
if (isProd) {
  const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

  // Serve static assets (JS, CSS, images)
  app.use(express.static(clientDistPath));

  // Root -> index.html
  app.get('/', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  // If you add client-side routing later, you can uncomment:
//   app.get('*', (_req, res) => {
//     res.sendFile(path.join(clientDistPath, 'index.html'));
//   });
} else {
  // Simple JSON root for dev
  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Riftbound API root (dev)',
    });
  });
}

// --- Start server ---
app.listen(PORT, () => {
  console.log('[Server] Listening on port ' + PORT);
});
