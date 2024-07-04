
const express = require('express');
const router = express.Router();

router.get('/sample', (req, res) => {
  res.json({ message: 'This is a sample message' });
});


router.get('/sample2', (req, res) => {
  res.json({ message: 'This is a sample message' });
});
  

module.exports = router;