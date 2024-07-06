
const express = require('express');
const AuthMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/obtain_records/pending/:last', AuthMiddleware.verifyToken, (req, res) => {
  //Do something with the DB to obtain
  res.json({ message: 'This is a sample message' });
});

router.get('/obtain_records/complete/:last',AuthMiddleware.verifyToken,(req, res) => {
  res.json({ message: 'This is a sample message' });
});
  


module.exports = router;