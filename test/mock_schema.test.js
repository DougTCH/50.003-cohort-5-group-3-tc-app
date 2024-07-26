const fs = require("node:fs");
const request = require('supertest');
const { BankAppInfo,getBankAppInfo } = require("../models/bank.js");
const set_config = require("../config_helper.js").set_config;
var server,cleanup;

var bAAdmins,lpAdmins
let users =[];
var haserr=false;
beforeAll(()=>{
    set_config("database",{
        "sql":"sqlite",
        "connection_str":"./mock.db"
    });
    set_config("authentication",{
        "jwt_secret":"mockkey"
    });
    var obj = require('../app.js');
    server = obj.server
    cleanup = obj.closeconnections;
    
    try{
        users = JSON.parse(fs.readFileSync('./test/users.json'));
        console.log(users);
    }catch(err){
        console.error(err);
        haserr = true;
    }
});

afterAll(async ()=>{
    await cleanup();
})

describe("Mock Setup",()=>{
    describe("Jest Self Test Suite",()=>{
        test("Testing myself",()=>{
            expect(1).toBe(1);
        });
        test("Getting Admin Account Mocks",()=>{
            var haserr = false;
            try{
                bAAdmins = JSON.parse(fs.readFileSync('./test/baAdmins.json'));
                lpAdmins = JSON.parse(fs.readFileSync('./test/lpAdmins.json'));
            }catch(err){
                //console.error(err);
                haserr = true;
            }
            expect(haserr).toBe(false);
            expect(bAAdmins.length).toBe(5);
            expect(lpAdmins.length).toBe(20);
        });
        test("Getting User Account Mocks",()=>{            
            expect(haserr).toBe(false);
            expect(users.length).toBe(28);
        });
    });
    
    describe("Unit Tests",()=>{

    });

    describe("Mock User Schema Test Suite",()=>{
        const user_authkeys = {}
        it("POST /auth/register:   Register users as intended", (done)=>{
            for(u of users){
                const {username,appcode,password} = u;
                request(server).post('/auth/register')
                .send({username,password,appcode}).
                expect(201).end((err,res)=>{
                    if(err)return done();
                    return done();
                });
            }
        });
        it("POST /auth/register:   Register existing users", (done)=>{
            for(u of users){
                const {username,appcode,password} = u;
                request(server).post('/auth/register')
                .send({username,password,appcode})
                .expect(500).end((err,res)=>{
                    if(err)return done();
                    return done();
                });
            }
        });
        
        it("POST /auth/login:  Login users wrong password", (done)=>{
            for(u of users){
                const {username,appcode} = u;
                request(server).post('/auth/login')
                .send({username,password:"NOTAPASSWORD",appcode})
                .expect(500)
                .end((err,res)=>{
                    if(err)return done(err);
                    return done();
                });
            }
        });
        it("POST /auth/login:  Login users wrong app", (done)=>{
            for(u of users){
                const {username,password} = u;
                request(server).post('/auth/login')
                .send({username,password,appcode:"NOTANAPP"})
                .expect(500)
                .end((err,res)=>{
                    if(err)return done(err);
                    return done();
                });
            }
        });
        it("POST /auth/login:  Login users invalid request", (done)=>{
            for(u of users){
                const {username,appcode} = u;
                request(server).post('/auth/login')
                .send({username,appcode})
                .expect(401)
                .end((err,res)=>{
                    if(err)return done(err);
                    return done();
                });
            }
        });
        it("POST /auth/login:   Login users valid credentials",(done)=>{
            toks = {}
            for(u of users){
                const {username,appcode,password} = u;
                request(server).post('/auth/login').send({username,password,appcode})
                .expect(200).end((err,res)=>{
                    if(err)return done(err);
                    expect(!(res.body.token in toks)).toBe(true);
                    toks[res.body.token] = 1;
                    user_authkeys[username] = res.body.token;
                    expect(res.body.token.length>10).toBe(true);
                    return done();
                });
            }
        });
        //TODO
        
        test.each(JSON.parse(fs.readFileSync('./test/users.json')).map((v)=>[v,user_authkeys[v.username],200]))("POST /transact/add_record: Add Valid Transaction Requests",async (u,utok,status)=>{
            // for(u of users){
            // console.log(u.username);
            // const {username,appcode,password} = u;
            if(!utok){
                console.error(`${u.username}-----`);
                //expect(false).toBe(true);
            }
            //console.log(appcode);
                await getBankAppInfo(u.appcode,async (err,arg)=>{
                    if(err){console.log(u.username);return;}//console.error(`${err} ${arg}`);return;}
                    else{
                    //console.log(`Bearer ${user_authkeys[username]}`);
                    request(server)
                    .post("/transact/add_record")
                    .set('authorization', `bearer ${utok}`)
                    .send({
                        "app_id": `"${u.appcode}"`,
                        "loyalty_pid": `${arg.getLPArray()[0]}`,
                        "user_id": `${u.username}_id`,
                        "member_id": `${u.username}`,
                        "member_first": `${u.username}_first`,
                        "member_last":`${u.username}_last`,
                        "transaction_date": "20240808",
                        "ref_num": `${u.username}_${u.appcode}_ref`,
                        "amount": 10000,
                        "additional_info": "tonnes of additionl info",
                      }).expect(200).end((err,res)=>{
                        if(err)console.error(err);
                        return;
                      });
                    }
                });
                //break;
        });
    });
});


