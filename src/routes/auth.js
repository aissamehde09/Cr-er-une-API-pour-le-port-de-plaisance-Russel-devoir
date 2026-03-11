const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { issueToken, setAuthCookie } = require('../middleware/auth');

const router = express.Router();

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

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  if (req.accepts('html')) {
    return res.redirect('/');
  }
  return res.json({ ok: true });
});

module.exports = router;
