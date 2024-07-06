
const express = require('express');
const {verifyToken,signToken} = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/obtain_records/pending/:last', verifyToken, (req, res) => {
  //Do something with the DB to obtain
  res.json({ message: 'This is a sample message' });
});

router.get('/obtain_records/complete/:last',verifyToken,(req, res) => {
  res.json({ message: 'This is a sample message' });
});
  


module.exports = router;