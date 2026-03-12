/**
 * Ce fichier aide pour et middleware d'authentification.
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * On récupère le token JWT depuis le header Authorization ou le cookie.
 * @param {import('express').Request} req
 * @returns {string | null}
 */
function getToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

/**
 * Ça renvoie une réponse non autorisée en HTML ou JSON.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {import('express').Response}
 */
function sendUnauthorized(req, res) {
  if (req.accepts('html')) {
    return res.redirect('/');
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Cette route demande un JWT valide pour accéder à la route.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void | import('express').Response>}
 */
async function authRequired(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return sendUnauthorized(req, res);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('username email');
    if (!user) {
      return sendUnauthorized(req, res);
    }
    req.user = user;
    return next();
  } catch (err) {
    return sendUnauthorized(req, res);
  }
}

/**
 * Si le token est bon, on met l'utilisateur dans req, sinon on continue sans user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function authOptional(req, res, next) {
  const token = getToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('username email');
    req.user = user || null;
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
}

/**
 * On génère un JWT pour l'utilisateur.
 * @param {{ _id: import('mongoose').Types.ObjectId }} user
 * @returns {string}
 */
function issueToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * On met le cookie d'authentification dans la réponse.
 * @param {import('express').Response} res
 * @param {string} token
 */
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax'
  });
}

module.exports = {
  authRequired,
  authOptional,
  issueToken,
  setAuthCookie
};

