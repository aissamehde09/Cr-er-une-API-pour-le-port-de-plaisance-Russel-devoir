/**
 * Ce fichier gère les routes d'authentification.
 * @module routes/auth
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { issueToken, setAuthCookie } = require('../middleware/auth');

const router = express.Router();

/**
 * Ça renvoie une erreur de connexion en HTML ou JSON.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} message
 * @returns {import('express').Response}
 */
function loginError(req, res, message) {
  if (req.accepts('html')) {
    return res.status(401).render('index', { error: message });
  }
  return res.status(401).json({ error: message });
}

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars')
  ],
  /**
   * Ça authentifie un utilisateur et émet un token.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return loginError(req, res, 'Identifiants invalides');
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return loginError(req, res, 'Identifiants invalides');
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return loginError(req, res, 'Identifiants invalides');
    }

    const token = issueToken(user);
    setAuthCookie(res, token);

    if (req.accepts('html')) {
      return res.redirect('/ui/dashboard');
    }

    return res.json({ token });
  }
);

/**
 * Ça supprime le cookie d'authentification et déconnecte.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {import('express').Response}
 */
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  if (req.accepts('html')) {
    return res.redirect('/');
  }
  return res.json({ ok: true });
});

module.exports = router;

