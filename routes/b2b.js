const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/authMiddleware.js');
const LoyaltyPrograms = require('../models/loyalty.js');
//#feature 1
router.post('/loyalty/update',AuthMiddleware.verifyB2BToken,(req,res)=>{
    LoyaltyPrograms.update_loyalty_program(req.body,()=>{
        res.status(200).json("success");
    },(err)=>{
        res.status(500).json({error:err});
    });
});

module.exports = router;