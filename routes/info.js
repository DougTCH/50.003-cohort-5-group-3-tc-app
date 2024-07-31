const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/authMiddleware.js');
const LoyaltyPrograms = require('../models/loyalty.js');
const BankAppInfo = require('../models/bank.js');


//#feature 1
router.get('/get-loyalty-programs',AuthMiddleware.verifyToken,async (req,res)=>{
    try{
    const { token } = req.body;
    await BankAppInfo.getBankAppInfo(token['app'],async (err,bai)=>{
        if(!err){
            //console.log("Getting Banking App LP list");
            var lp_arr = bai.getLPArray();
            await LoyaltyPrograms.get_loyalty_program(lp_arr,(err,rows)=>{
                if(err){
                    console.error(err);
                    return res.status(500).json('error');
                }
                return res.status(200).json(rows);
            });
        }else{
            console.error(err);
            return res.status(500).json('not found');
        }
        });
    }
    catch(err){
        console.error(err);
        return res.status(401).json('error');
    }
});

module.exports = router;