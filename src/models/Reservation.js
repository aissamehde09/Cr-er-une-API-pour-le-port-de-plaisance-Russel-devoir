/**
 * Ce fichier définit le modèle Mongoose Reservation.
 * @module models/Reservation
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} Reservation
 * @property {number} catwayNumber
 * @property {string} clientName
 * @property {string} boatName
 * @property {Date} startDate
 * @property {Date} endDate
 */

/** @type {import('mongoose').Schema<Reservation>} */
const reservationSchema = new mongoose.Schema(
  {
    catwayNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    boatName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

/**
 * Ça vérifie que endDate est après startDate.
 * @param {import('mongoose').CallbackWithoutResult} next
 */
reservationSchema.pre('validate', function validateDates(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'endDate must be after startDate');
  }
  next();
});

reservationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);

