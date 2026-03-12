/**
 * Ce fichier gère les routes de documentation API.
 * @module routes/docs
 */

const express = require('express');

const router = express.Router();

/**
 * Ça affiche la page de documentation.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {import('express').Response}
 */
router.get('/', (req, res) => {
  return res.render('docs', { user: null });
});

module.exports = router;

