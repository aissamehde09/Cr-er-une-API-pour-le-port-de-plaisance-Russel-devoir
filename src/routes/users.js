/**
 * Ce fichier gère les routes utilisateurs (CRUD).
 * @module routes/users
 */

const express = require('express');
const { body, param } = require('express-validator');
const User = require('../models/User');
const handleValidation = require('../middleware/validate');

const router = express.Router();

/**
 * Petite règle express-validator pour le paramètre email.
 * @type {import('express-validator').ValidationChain}
 */
const emailParamValidator = param('email').custom((value) => {
  const decoded = decodeURIComponent(value);
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(decoded)) {
    throw new Error('Valid email required');
  }
  return true;
});

/**
 * Ça liste tous les utilisateurs.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
router.get('/', async (req, res) => {
  const users = await User.find().select('username email');
  return res.json(users);
});

router.get(
  '/:email',
  [emailParamValidator],
  handleValidation,
  /**
   * Ça récupère un utilisateur par email.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const user = await User.findOne({ email }).select('username email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  }
);

router.post(
  '/',
  [
    body('username').trim().isLength({ min: 2, max: 50 }).withMessage('username is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars')
  ],
  handleValidation,
  /**
   * Ça crée un utilisateur.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async (req, res) => {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash
    });

    return res.status(201).json(user);
  }
);

router.put(
  '/:email',
  [emailParamValidator],
  handleValidation,
  /**
   * Ça met à jour un utilisateur par email.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async (req, res) => {
    const emailParam = decodeURIComponent(req.params.email).toLowerCase();
    const user = await User.findOne({ email: emailParam });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, email, password } = req.body;

    if (!username && !email && !password) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    if (username) {
      user.username = username.trim();
    }

    if (email) {
      const normalized = email.toLowerCase();
      if (normalized !== user.email) {
        const exists = await User.findOne({ email: normalized });
        if (exists) {
          return res.status(409).json({ error: 'Email already in use' });
        }
        user.email = normalized;
      }
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 chars' });
      }
      user.passwordHash = await User.hashPassword(password);
    }

    await user.save();
    return res.json(user);
  }
);

router.delete(
  '/:email',
  [emailParamValidator],
  handleValidation,
  /**
   * Ça supprime un utilisateur par email.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const user = await User.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ ok: true });
  }
);

module.exports = router;

