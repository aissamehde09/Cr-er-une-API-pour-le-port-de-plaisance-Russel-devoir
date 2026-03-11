const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

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

function sendUnauthorized(req, res) {
  if (req.accepts('html')) {
    return res.redirect('/');
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

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

function issueToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '8h' });
}

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
