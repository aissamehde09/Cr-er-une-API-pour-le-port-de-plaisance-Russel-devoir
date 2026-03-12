/**
 * Ce fichier gère les routes des réservations (imbriquées sous catways).
 * @module routes/reservations
 */

const express = require('express');
const { body, param } = require('express-validator');
const handleValidation = require('../middleware/validate');
const reservationsController = require('../controllers/reservationsController');

const router = express.Router({ mergeParams: true });

/**
 * Ça valide le paramètre id du catway.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {import('express').Response | void}
 */
router.use((req, res, next) => {
  const catwayNumber = Number(req.params.id);
  if (!Number.isInteger(catwayNumber) || catwayNumber < 1) {
    return res.status(400).json({ error: 'catwayNumber must be a positive integer' });
  }
  return next();
});

router.get('/', reservationsController.listByCatway);

router.get(
  '/:idReservation',
  [param('idReservation').isMongoId().withMessage('Valid reservation id required')],
  handleValidation,
  reservationsController.getById
);

router.post(
  '/',
  [
    body('clientName').trim().isLength({ min: 2, max: 100 }).withMessage('clientName required'),
    body('boatName').trim().isLength({ min: 2, max: 100 }).withMessage('boatName required'),
    body('startDate').isISO8601().withMessage('startDate must be ISO date').toDate(),
    body('endDate').isISO8601().withMessage('endDate must be ISO date').toDate()
  ],
  handleValidation,
  reservationsController.create
);

router.put(
  '/:idReservation',
  [
    param('idReservation').isMongoId().withMessage('Valid reservation id required'),
    body('clientName').optional().trim().isLength({ min: 2, max: 100 }),
    body('boatName').optional().trim().isLength({ min: 2, max: 100 }),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate()
  ],
  handleValidation,
  reservationsController.updateById
);

router.put(
  '/',
  [
    body('reservationId').isMongoId().withMessage('reservationId required'),
    body('clientName').optional().trim().isLength({ min: 2, max: 100 }),
    body('boatName').optional().trim().isLength({ min: 2, max: 100 }),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate()
  ],
  handleValidation,
  reservationsController.updateByBody
);

router.delete(
  '/:idReservation',
  [param('idReservation').isMongoId().withMessage('Valid reservation id required')],
  handleValidation,
  reservationsController.remove
);

module.exports = router;

