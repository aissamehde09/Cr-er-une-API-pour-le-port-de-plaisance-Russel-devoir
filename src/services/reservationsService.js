const Reservation = require('../models/Reservation');

async function findByIdAndCatway(id, catwayNumber) {
  return Reservation.findOne({ _id: id, catwayNumber });
}

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

async function listByCatway(catwayNumber) {
  return Reservation.find({ catwayNumber }).sort({ startDate: -1 });
}

async function listAll() {
  return Reservation.find().sort({ startDate: -1 });
}

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
