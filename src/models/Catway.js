/**
 * Ce fichier définit le modèle Mongoose Catway.
 * @module models/Catway
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} Catway
 * @property {number} catwayNumber
 * @property {'long'|'short'} catwayType
 * @property {string} catwayState
 */

/** @type {import('mongoose').Schema<Catway>} */
const catwaySchema = new mongoose.Schema(
  {
    catwayNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1
    },
    catwayType: {
      type: String,
      required: true,
      enum: ['long', 'short']
    },
    catwayState: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

catwaySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Catway', catwaySchema);

