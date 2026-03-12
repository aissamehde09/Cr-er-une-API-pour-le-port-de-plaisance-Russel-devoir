/**
 * Ce fichier gère les routes de listing des réservations.
 * @module routes/reservationsAll
 */

const express = require('express');
const reservationsController = require('../controllers/reservationsController');

const router = express.Router();

/**
 * Ça liste toutes les réservations.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
router.get('/', reservationsController.listAll);

module.exports = router;

