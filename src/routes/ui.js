const express = require('express');
const Catway = require('../models/Catway');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  const today = new Date();
  const currentReservations = await Reservation.find({
    startDate: { $lte: today },
    endDate: { $gte: today }
  }).sort({ startDate: 1 });

  return res.render('dashboard', {
    user: req.user,
    today: today.toISOString().slice(0, 10),
    currentReservations
  });
});

router.get('/catways', async (req, res) => {
  const catways = await Catway.find().sort({ catwayNumber: 1 });
  return res.render('catways', { user: req.user, catways });
});

router.get('/reservations', async (req, res) => {
  const reservations = await Reservation.find().sort({ startDate: -1 });
  const catways = await Catway.find().sort({ catwayNumber: 1 });
  return res.render('reservations', {
    user: req.user,
    reservations,
    catways
  });
});

router.get('/users', async (req, res) => {
  const users = await User.find().select('username email').sort({ email: 1 });
  return res.render('users', { user: req.user, users });
});

module.exports = router;
