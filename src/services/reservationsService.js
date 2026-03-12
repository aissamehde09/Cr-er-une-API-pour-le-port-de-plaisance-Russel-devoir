/**
 * Ce fichier aide pour l'accès aux données des réservations.
 * @module services/reservationsService
 */

const Reservation = require('../models/Reservation');

/**
 * Ça cherche une réservation par id et numéro de catway.
 * @param {string} id
 * @param {number} catwayNumber
 * @returns {Promise<import('../models/Reservation') | null>}
 */
async function findByIdAndCatway(id, catwayNumber) {
  return Reservation.findOne({ _id: id, catwayNumber });
}

/**
 * Ça cherche une réservation en conflit sur une période.
 * @param {number} catwayNumber
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} [excludeId]
 * @returns {Promise<import('../models/Reservation') | null>}
 */
async function findConflictingReservation(catwayNumber, startDate, endDate, excludeId) {
  const query = {
    catwayNumber,
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Reservation.findOne(query).select('_id catwayNumber startDate endDate');
}

/**
 * Ça liste les réservations d'un catway.
 * @param {number} catwayNumber
 * @returns {Promise<Array<import('../models/Reservation')>>}
 */
async function listByCatway(catwayNumber) {
  return Reservation.find({ catwayNumber }).sort({ startDate: -1 });
}

/**
 * Ça liste toutes les réservations.
 * @returns {Promise<Array<import('../models/Reservation')>>}
 */
async function listAll() {
  return Reservation.find().sort({ startDate: -1 });
}

/**
 * Ça crée un enregistrement de réservation.
 * @param {Object} data
 * @param {number} data.catwayNumber
 * @param {string} data.clientName
 * @param {string} data.boatName
 * @param {Date} data.startDate
 * @param {Date} data.endDate
 * @returns {Promise<import('../models/Reservation')>}
 */
async function createReservation(data) {
  return Reservation.create(data);
}

module.exports = {
  findByIdAndCatway,
  findConflictingReservation,
  listByCatway,
  listAll,
  createReservation
};


