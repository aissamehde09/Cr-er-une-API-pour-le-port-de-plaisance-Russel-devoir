const Catway = require('../models/Catway');
const Reservation = require('../models/Reservation');
const reservationService = require('../services/reservationsService');
const { respondError } = require('../utils/respond');

async function ensureCatwayExists(catwayNumber) {
  const catway = await Catway.findOne({ catwayNumber });
  return !!catway;
}

function extractUpdate(body) {
  const update = {};
  ['clientName', 'boatName', 'startDate', 'endDate'].forEach((field) => {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  });
  return update;
}

function handleUnexpected(req, res, err) {
  return respondError(req, res, 500, 'Erreur serveur', [
    { field: 'server', message: err.message || 'Erreur inattendue' }
  ]);
}

async function listByCatway(req, res) {
  try {
    const catwayNumber = Number(req.params.id);
    const reservations = await reservationService.listByCatway(catwayNumber);
    return res.json(reservations);
  } catch (err) {
    return handleUnexpected(req, res, err);
  }
}

async function listAll(req, res) {
  try {
    const reservations = await reservationService.listAll();
    return res.json(reservations);
  } catch (err) {
    return handleUnexpected(req, res, err);
  }
}

async function getById(req, res) {
  try {
    const catwayNumber = Number(req.params.id);
    const reservation = await reservationService.findByIdAndCatway(
      req.params.idReservation,
      catwayNumber
    );

    if (!reservation) {
      return respondError(req, res, 404, 'Réservation introuvable', [
        { field: 'idReservation', message: 'Réservation introuvable' }
      ]);
    }

    return res.json(reservation);
  } catch (err) {
    return handleUnexpected(req, res, err);
  }
}

async function create(req, res) {
  try {
    const catwayNumber = Number(req.params.id);

    const catwayExists = await ensureCatwayExists(catwayNumber);
    if (!catwayExists) {
      return respondError(req, res, 404, 'Catway introuvable', [
        { field: 'catwayNumber', message: 'Catway introuvable' }
      ]);
    }

    const conflict = await reservationService.findConflictingReservation(
      catwayNumber,
      req.body.startDate,
      req.body.endDate
    );

    if (conflict) {
      return respondError(req, res, 409, 'Conflit de réservation', [
        { field: 'dates', message: 'Le catway est déjà réservé sur cette période.' }
      ]);
    }

    const reservation = await reservationService.createReservation({
      catwayNumber,
      clientName: req.body.clientName,
      boatName: req.body.boatName,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    });

    if (req.accepts('html')) {
      return res.redirect('/ui/reservations');
    }

    return res.status(201).json(reservation);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return respondError(req, res, 400, 'Erreur de validation', [
        { field: 'dates', message: err.message }
      ]);
    }
    return handleUnexpected(req, res, err);
  }
}

async function updateById(req, res) {
  try {
    const catwayNumber = Number(req.params.id);
    const update = extractUpdate(req.body);

    if (Object.keys(update).length === 0) {
      return respondError(req, res, 400, 'Erreur de validation', [
        { field: 'body', message: 'Aucun champ à mettre à jour.' }
      ]);
    }

    const reservation = await reservationService.findByIdAndCatway(
      req.params.idReservation,
      catwayNumber
    );

    if (!reservation) {
      return respondError(req, res, 404, 'Réservation introuvable', [
        { field: 'idReservation', message: 'Réservation introuvable' }
      ]);
    }

    const nextStart = update.startDate || reservation.startDate;
    const nextEnd = update.endDate || reservation.endDate;
    if (nextEnd <= nextStart) {
      return respondError(req, res, 400, 'Erreur de validation', [
        { field: 'endDate', message: 'La date de fin doit être après la date de début.' }
      ]);
    }

    const conflict = await reservationService.findConflictingReservation(
      catwayNumber,
      nextStart,
      nextEnd,
      reservation._id
    );

    if (conflict) {
      return respondError(req, res, 409, 'Conflit de réservation', [
        { field: 'dates', message: 'Le catway est déjà réservé sur cette période.' }
      ]);
    }

    reservation.set(update);
    await reservation.save();

    return res.json(reservation);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return respondError(req, res, 400, 'Erreur de validation', [
        { field: 'dates', message: err.message }
      ]);
    }
    return handleUnexpected(req, res, err);
  }
}

async function updateByBody(req, res) {
  req.params.idReservation = req.body.reservationId;
  return updateById(req, res);
}

async function remove(req, res) {
  try {
    const catwayNumber = Number(req.params.id);
    const reservation = await Reservation.findOneAndDelete({
      _id: req.params.idReservation,
      catwayNumber
    });

    if (!reservation) {
      return respondError(req, res, 404, 'Réservation introuvable', [
        { field: 'idReservation', message: 'Réservation introuvable' }
      ]);
    }

    return res.json({ ok: true });
  } catch (err) {
    return handleUnexpected(req, res, err);
  }
}

module.exports = {
  listAll,
  listByCatway,
  getById,
  create,
  updateById,
  updateByBody,
  remove
};
