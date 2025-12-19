'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

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

// --- Basic routes ---
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

// --- Start server ---
app.listen(PORT, () => {
  console.log('[Server] Listening on port ' + PORT);
});
