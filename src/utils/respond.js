/**
 * Helper de réponse d'erreur.
 * @module utils/respond
 */

/**
 * Envoie une réponse d'erreur en HTML ou JSON.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} title
 * @param {Array<{field: string, message: string}>} errors
 * @returns {import('express').Response}
 */
function respondError(req, res, status, title, errors) {
  if (req.accepts('html')) {
    return res.status(status).render('error', {
      title,
      errors
    });
  }
  return res.status(status).json({
    error: title,
    errors
  });
}

module.exports = {
  respondError
};

