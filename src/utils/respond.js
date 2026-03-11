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
