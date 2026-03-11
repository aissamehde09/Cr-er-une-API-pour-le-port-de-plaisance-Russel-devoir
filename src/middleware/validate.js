const { validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg
  }));

  if (req.accepts('html')) {
    return res.status(400).render('error', {
      title: 'Erreur de validation',
      errors
    });
  }

  return res.status(400).json({ errors });
}

module.exports = handleValidation;
