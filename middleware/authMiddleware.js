const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
     /*
    #swagger.autoHeaders = false 
    #swagger.security = [{
            "bearerAuth": []
    }] */

    if(!req.headers['authorization']){
        res.status(401).json({error: 'Invalid Headers'});
        throw "Invalid header";
    }
    const token = req.headers['authorization'].split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        return next();
    } 
    catch (error) {
        console.log(error);
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
        if(!decoded['role']) throw "Invalid token";
        if(decoded['role']=='b2b'){ 
            next();
            return;
        } 
        else{
            throw "Invalid token";
        }
    });
};

function signToken(user,appcode){
    return jwt.sign({ userId: user.hashed_id, app:appcode }, 'your-secret-key', {
        expiresIn: '1h',
    });
}

function signB2BToken(user,appcode){
    return jwt.sign({ userId: user.hashed_id, app:appcode ,role:'b2b'}, 'your-secret-key', {
        expiresIn: '2h',
    });
}

const AuthMiddleware = {verifyToken:verifyToken,verifyB2BToken:verifyB2BToken,signToken:signToken,signB2BToken:signB2BToken};
module.exports = AuthMiddleware;