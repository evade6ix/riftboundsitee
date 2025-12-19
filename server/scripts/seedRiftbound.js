'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Card = require('../models/Card');

const MONGO_URI = process.env.MONGODB_URI;
const API_KEY = process.env.API_TCG_KEY;

const API_URL = 'https://apitcg.com/api/riftbound/cards';

if (!MONGO_URI) {
  console.error('[Seed] Missing MONGODB_URI in environment');
  process.exit(1);
}

if (!API_KEY) {
  console.error('[Seed] Missing API_TCG_KEY in environment');
  process.exit(1);
}

async function connectMongo() {
  console.log('[Seed] Connecting to Mongo...');
  await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });
  console.log('[Seed] Mongo connected');
}

async function fetchPage(page) {
  console.log(`[Seed] Fetching page ${page}...`);
  const res = await axios.get(API_URL, {
    params: { page },
    headers: {
      'x-api-key': API_KEY
    },
    timeout: 30000
  });
  return res.data;
}

function mapCardPayload(card) {
  return {
    game: 'riftbound',
    remoteId: card.id,

    code: card.code,
    number: card.number,
    name: card.name,
    cleanName: card.cleanName,

    rarity: card.rarity,
    cardType: card.cardType,
    domain: card.domain,
    energyCost: card.energyCost,
    powerCost: card.powerCost,
    might: card.might,

    description: card.description,
    flavorText: card.flavorText,

    images: {
      small: card.images?.small || null,
      large: card.images?.large || null
    },

    set: {
      id: card.set?.id || null,
      name: card.set?.name || null,
      releaseDate: card.set?.releaseDate || null
    },

    tcgplayer: {
      id: card.tcgplayer?.id || null,
      url: card.tcgplayer?.url || null
    },

    presaleInfo: {
      isPresale: card.presaleInfo?.isPresale ?? null,
      releasedOn: card.presaleInfo?.releasedOn || null,
      note: card.presaleInfo?.note || null
    },

    modifiedOn: card.modifiedOn || null,

    raw: card
  };
}

async function run() {
  try {
    await connectMongo();

    let page = 1;
    let totalPages = 1;
    let totalUpserts = 0;

    while (page <= totalPages) {
      const payload = await fetchPage(page);

      totalPages = payload.totalPages || 1;
      const cards = payload.data || [];

      console.log(`[Seed] Page ${page}/${totalPages} - ${cards.length} cards`);

      for (const card of cards) {
        const doc = mapCardPayload(card);

        await Card.updateOne(
          { game: 'riftbound', remoteId: doc.remoteId },
          { $set: doc },
          { upsert: true }
        );

        totalUpserts++;
      }

      page++;
    }

    console.log(`[Seed] Done. Total upserts: ${totalUpserts}`);
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Mongo disconnected');
    process.exit(0);
  }
}

run();
