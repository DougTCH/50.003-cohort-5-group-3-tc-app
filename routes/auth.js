// routes/auth.js
const express = require('express');
const router = express.Router();
//const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var user = {};
//Place Holder User model function
async function  makeUser(username,password){
    user =  {username:username,password:await bcrypt.hash(password, 10)}
}
// User registration
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        //const hashedPassword = await bcrypt.hash(password, 10);
        await makeUser(username,password)
        //await user.save();
        res.status(201).json({ message: `User registered successfully: ${user.username}`});
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login:
router.post('/login', async (req, res) => {
    try {
        const { username, password, app_code } = req.body;
        //const user = {username:username, password:"123456"}
        if (!user || username!=user.username) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const token = jwt.sign({ userId: user._id, app_code:app_code }, 'your-secret-key', {
            expiresIn: '1h',
        });
        res.status(200).json({ token });
    } 
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;