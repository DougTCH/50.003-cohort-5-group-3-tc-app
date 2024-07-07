const bcrypt = require('bcrypt');
const AuthMiddleware = require('../middleware/authMiddleware.js');
var crypto = require('crypto')

class User{
    #username;
    #appcode;
    constructor(username,appcode){
        this.#username = username;
        this.#appcode = appcode;
        this.hashedid = crypto.createHash('sha1').update(`${username}${appcode}`).digest('hex');
    }
    getDBObj(hashed_pw){
        return {username:this.hashedid,password:hashed_pw};
    }
    perror(code){
        var msg = "" 
        switch(code){
            case 100:
                msg = `Username ${this.#username} exists`;
                break;
            case 101:
                msg = `Invalid Application Code ${this.#appcode}`;
                break;
            case 102:
                msg = "Invalid Token";
        }
        return msg;
    }
    static createTable(){
        return `CREATE TABLE IF NOT EXISTS users (
            hashed_id TEXT NOT NULL UNIQUE,
            hashed_pw TEXT NOT NULL
        );`;
    }
    getSQLInsert(hashed_pw){
        return `INSERT INTO users (hashed_id, hashed_pw)
        VALUES ('${this.hashedid}','${hashed_pw}');`;
    }
}

async function createUser(username,appcode,password,db,success,failed){

    if(!db) return failed('NO DB');

    var u = new User(username,appcode);
    
    db.get(
        //#swagger.ignore = true
        `SELECT hashed_id uid FROM users
        WHERE hashed_id = '${u.hashedid}'`,
        async (err,row)=>{
            if(err){
                return failed("Failed to create user");
            }
            if(row){
                return failed("User already exists");
            }
            var db_obj = u.getDBObj(await bcrypt.hash(password,10));
            db.serialize(()=>{
                db.run(u.getSQLInsert(db_obj['password']),(err)=>{
                    if(err){
                        failed(err);
                        return;
                    }
                    success();
                });
            });
        }
    );  
}

async function login(username,appcode,password,db,success,failed){
    var u = new User(username,appcode);
    db.get(
        //#swagger.ignore = true
        `SELECT hashed_id uid, hashed_pw pwdhash FROM users
        WHERE hashed_id = '${u.hashedid}'`,
        async (err,row)=>{
            if(err){
                console.log(`Internal Server Error login: ${err}`);
                return failed("Failed to login");
            }
            if(row){
                //var auth_obj = u.getDBObj(await bcrypt.hash(password,10));
                if(await bcrypt.compare(password,row.pwdhash)){
                    return success(AuthMiddleware.signToken(username,appcode));
                }
            }
            return failed("Login Attempt failed");
        });  
}
async function b2blogin(username,appcode,password,db,success,failed){
    var u = new User(username,appcode);
    db.get(
        //#swagger.ignore = true
        `SELECT hashed_id uid, hashed_pw pwdhash FROM loyaltyprograms
        WHERE hashed_id = '${u.hashedid}'`,
        async (err,row)=>{
            if(err){
                console.log(`Internal Server Error login: ${err}`);
                return failed("Failed to login");
            }
            if(row){
                //var auth_obj = u.getDBObj(await bcrypt.hash(password,10));
                if(await bcrypt.compare(password,row.pwdhash)){
                    return success(AuthMiddleware.signB2BToken(username,appcode));
                }
            }
            return failed("Login Attempt failed");
        });  
}

module.exports = {User:User,createUser:createUser,loginUser:login,B2BLogin:b2blogin};