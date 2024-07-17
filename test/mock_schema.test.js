const fs = require("node:fs");
const request = require('supertest');
const set_config = require("../config_helper.js").set_config;
var server,cleanup;

var bAAdmins,lpAdmins,users;
beforeAll(()=>{
    set_config("database",{
        "sql":"sqlite",
        "connection_str":"./mock.db"
    });
    set_config("authentication",{
        "jwt_secret":"password123456"
    });
    var obj = require('../app.js');
    server = obj.server
    cleanup = obj.closeconnections;
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
            var haserr = false;
            try{
                users = JSON.parse(fs.readFileSync('./test/users.json'));
            }catch(err){
                //console.error(err);
                haserr = true;
            }
            expect(haserr).toBe(false);
            expect(users.length).toBe(28);
        });
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
        it("POST /auth/login:   Login users valid credentials",(done)=>{
            for(u of users){
                const {username,appcode,password} = u;
                request(server).post('/auth/login').send({username,password,appcode})
                .expect(200).end((err,res)=>{
                    if(err)return done(err);
                    user_authkeys[username] = res.body.token;
                    expect(res.body.token.length>0).toBe(true);
                    return done();
                });
            }
        });
    });
});


