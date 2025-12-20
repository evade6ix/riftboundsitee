cat << 'EOF' > server/index.js
'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Card = require('./models/Card');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/riftbound_local';
const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-me';

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

// --- Simple auth middleware for /auth/me ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Health route (for Railway monitoring) ---
app.get('/health', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1; // 1 = connected
  res.json({
    status: 'ok',
    mongoConnected: mongoReady,
  });
});

// ---------------- AUTH ROUTES ----------------

// POST /auth/register
// body: { name, email, password }
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account already exists for that email.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('[POST /auth/register] Error:', err.message);
    res.status(500).json({ error: 'Failed to register.' });
  }
});

// POST /auth/login
// body: { email, password }
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('[POST /auth/login] Error:', err.message);
    res.status(500).json({ error: 'Failed to login.' });
  }
});

// GET /auth/me  (optional: validate token & fetch user)
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error('[GET /auth/me] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ---------------- CARD ROUTES ----------------

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

// GET /cards/:remoteId
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

  app.use(express.static(clientDistPath));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
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
EOF
