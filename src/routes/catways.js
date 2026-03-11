const express = require('express');
const { body, param } = require('express-validator');
const Catway = require('../models/Catway');
const Reservation = require('../models/Reservation');
const handleValidation = require('../middleware/validate');
const reservationRoutes = require('./reservations');

const router = express.Router();

router.get('/', async (req, res) => {
  const catways = await Catway.find().sort({ catwayNumber: 1 });
  return res.json(catways);
});

router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('catwayNumber must be a positive integer')],
  handleValidation,
  async (req, res) => {
    const catwayNumber = Number(req.params.id);
    const catway = await Catway.findOne({ catwayNumber });
    if (!catway) {
      return res.status(404).json({ error: 'Catway not found' });
    }
    return res.json(catway);
  }
);

router.post(
  '/',
  [
    body('catwayNumber').isInt({ min: 1 }).withMessage('catwayNumber must be a positive integer'),
    body('catwayType').isIn(['long', 'short']).withMessage('catwayType must be long or short'),
    body('catwayState').trim().isLength({ min: 2, max: 500 }).withMessage('catwayState is required')
  ],
  handleValidation,
  async (req, res) => {
    const { catwayNumber, catwayType, catwayState } = req.body;

    const existing = await Catway.findOne({ catwayNumber });
    if (existing) {
      return res.status(409).json({ error: 'catwayNumber already exists' });
    }

    const catway = await Catway.create({
      catwayNumber,
      catwayType,
      catwayState
    });

    return res.status(201).json(catway);
  }
);

router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('catwayNumber must be a positive integer'),
    body('catwayState').trim().isLength({ min: 2, max: 500 }).withMessage('catwayState is required')
  ],
  handleValidation,
  async (req, res) => {
    const catwayNumber = Number(req.params.id);
    const catway = await Catway.findOneAndUpdate(
      { catwayNumber },
      { catwayState: req.body.catwayState },
      { new: true, runValidators: true }
    );

    if (!catway) {
      return res.status(404).json({ error: 'Catway not found' });
    }

    return res.json(catway);
  }
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('catwayNumber must be a positive integer')],
  handleValidation,
  async (req, res) => {
    const catwayNumber = Number(req.params.id);
    const catway = await Catway.findOneAndDelete({ catwayNumber });
    if (!catway) {
      return res.status(404).json({ error: 'Catway not found' });
    }

    await Reservation.deleteMany({ catwayNumber });

    if (req.accepts('html')) {
      return res.redirect('/ui/catways');
    }

    return res.json({ ok: true });
  }
);

router.use('/:id/reservations', reservationRoutes);

module.exports = router;
