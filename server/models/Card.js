const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    game: { type: String, required: true },       // e.g. "riftbound"
    remoteId: { type: String, required: true },   // API TCG card id, e.g. "origins-proving-grounds-001/024"

    code: { type: String },
    number: { type: String },
    name: { type: String },
    cleanName: { type: String },

    rarity: { type: String },
    cardType: { type: String },
    domain: { type: String },
    energyCost: { type: String },
    powerCost: { type: String },
    might: { type: String },

    description: { type: String },
    flavorText: { type: String },

    images: {
      small: { type: String },
      large: { type: String }
    },

    set: {
      id: { type: String },
      name: { type: String },
      releaseDate: { type: String }
    },

    tcgplayer: {
      id: { type: Number },
      url: { type: String }
    },

    presaleInfo: {
      isPresale: { type: Boolean },
      releasedOn: { type: String },
      note: { type: String }
    },

    modifiedOn: { type: String },

    // Keep full original payload so we can always dig later
    raw: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Unique per game + remoteId
cardSchema.index({ game: 1, remoteId: 1 }, { unique: true });
// For searches
cardSchema.index({ game: 1, name: 1 });
cardSchema.index({ game: 1, cleanName: 1 });

module.exports = mongoose.model('Card', cardSchema);
