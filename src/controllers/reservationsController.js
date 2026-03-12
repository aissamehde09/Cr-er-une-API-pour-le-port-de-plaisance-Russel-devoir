/**
 * Ce fichier contient les contrôleurs des réservations.
 * @module controllers/reservationsController
 */

const Catway = require('../models/Catway');
const Reservation = require('../models/Reservation');
const reservationService = require('../services/reservationsService');
const { respondError } = require('../utils/respond');

/**
 * Ça vérifie l'existence d'un catway.
 * @param {number} catwayNumber
 * @returns {Promise<boolean>}
 */
async function ensureCatwayExists(catwayNumber) {
  const catway = await Catway.findOne({ catwayNumber });
  return !!catway;
}

/**
 * Ça récupère les champs modifiables du corps de requête.
 * @param {Record<string, any>} body
 * @returns {{clientName?: string, boatName?: string, startDate?: Date, endDate?: Date}}
 */
function extractUpdate(body) {
  const update = {};
  ['clientName', 'boatName', 'startDate', 'endDate'].forEach((field) => {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  });
  return update;
}

/**
 * Ici on gère des erreurs inattendues.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Error} err
 * @returns {import('express').Response}
 */
function handleUnexpected(req, res, err) {
  return respondError(req, res, 500, 'Erreur serveur', [
    { field: 'server', message: err.message || 'Erreur inattendue' }
  ]);
}

/**
 * Ça liste les réservations d'un catway.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
async function listByCatway(req, res) {
  try {
    const catwayNumber = Number(req.params.id);
    const reservations = await reservationService.listByCatway(catwayNumber);
    return res.json(reservations);
  } catch (err) {
    return handleUnexpected(req, res, err);
  }
}

/**
 * Ça liste toutes les réservations.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
async function listAll(req, res) {
  try {
    const reservations = await reservationService.listAll();
    return res.json(reservations);
  } catch (err) {
    return handleUnexpected(req, res, err);
  }
}

/**
 * Ça renvoie les détails d'une réservation par id (scopée à un catway).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
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

/**
 * Ça crée une réservation pour un catway.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
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

/**
 * Ça met à jour une réservation par id.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
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

/**
 * Ça met à jour une réservation quand l'id est fourni dans le corps.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
async function updateByBody(req, res) {
  req.params.idReservation = req.body.reservationId;
  return updateById(req, res);
}

/**
 * Ça supprime une réservation par id.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
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

