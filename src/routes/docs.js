const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  return res.render('docs', { user: null });
});

module.exports = router;
