// routes/auth.js
const express = require('express');
const router = express.Router();
const {User,createUser,loginUser} = require('../models/user.js');
const db = require('../services/db_adaptor.js');

// User registration
router.post('/register', async (req, res) => {
    try {
        const { username, app_code, password } = req.body;
        await createUser(username,app_code,password,db,()=>{
            return res.status(201).json({ message: `User registered successfully: ${username}`});
        },
        (err)=>{
                //console.log(err);
                return res.status(500).json({ error: err });    
        });
    }
    catch (error) {
        console.log(`Outer Layer: ${error}`);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login:
router.post('/login', async (req, res) => {
    try {   
        const { username, password, app_code } = req.body;
        //const user = {username:username, password:"123456"}
        if (!username || !password) {
            return res.status(401).json({ error: 'Authentication failed' });
        }

        loginUser(username,app_code,password,db,(token)=>{
            res.status(200).json({ token });
        },(err)=>{
            res.status(500).json({ error: 'Login failed' });    
        });
    } 
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/b2b/getauth',async(req,res)=>{
    try {   
        const { username, password, app_code } = req.body;
        //const user = {username:username, password:"123456"}
        if (!username || !password) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const {B2BLogin} = require('../models/user.js');
        B2BLogin(username,app_code,password,db,(token)=>{
            console.log('success');
            res.status(200).json({ token });
        },(err)=>{
            console.warn(`B2B Login Failed: ${app_code}`);
            res.status(501).json({ error: 'Login failed' });    
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;