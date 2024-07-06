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
        req.userId = decoded.userId;
        next();
    } 
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

function signToken(user,appcode){
    return jwt.sign({ userId: user.hashed_id, app:appcode }, 'your-secret-key', {
        expiresIn: '1h',
    });
}
module.exports = {verifyToken:verifyToken,signToken:signToken};