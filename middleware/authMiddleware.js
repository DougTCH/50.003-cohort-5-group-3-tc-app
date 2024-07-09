const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const prompt = require("prompt-sync")({ sigint: true });

var pw = prompt.hide('JWT Key?: ');

function verifyToken(req, res, next) {
     /*
    #swagger.autoHeaders = false 
    #swagger.security = [{
            "bearerAuth": []
    }] */
    try {
        if(!req.headers['authorization']){
            res.status(401).json({error: 'Invalid Headers'});
            throw "Invalid header";
        }
        const token = req.headers['authorization'].split(' ')[1];

        if (!token) return res.status(401).json({ error: 'Access denied' });
            const decoded = jwt.verify(token, pw);
            req.body.token = decoded;
            return next();
        } 
        catch (error) {
            //console.log(error);
            res.status(401).json({ error: 'Invalid token' });
        }
};

function verifyB2BToken(req, res, next) {
    /*
   #swagger.autoHeaders = false 
   #swagger.security = [{
           "bearerAuth": []
   }] */
   verifyToken(req,res,(decoded)=>{
        if(!decoded['role']||!decoded['app']) throw "Invalid token";
        if(decoded['role']=='b2b' && decoded['app']==req.body.app){ 
            next();
            return;
        } 
        else{
            throw "Invalid token";
        }
    });
};

function signToken(user,appcode){
    return jwt.sign({ username: user, app:appcode, role:'user' }, pw, {
        expiresIn: '1h',
    });
}

function signB2BToken(user,appcode){
    return jwt.sign({ username: user, app:appcode ,role:'b2b'}, pw, {
        expiresIn: '2h',
    });
}

const AuthMiddleware = {verifyToken:verifyToken,verifyB2BToken:verifyB2BToken,signToken:signToken,signB2BToken:signB2BToken};
module.exports = AuthMiddleware;