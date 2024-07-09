
const db = require('../services/db_adaptor.js');
const tblname = 'loyalty_programs';
class LoyaltyProgramInfo{
    constructor(sqlrow){
        this.pid = sqlrow.pid;
        this.name = sqlrow.name;
        this.cur_name = sqlrow.currency;
        this.p_time = sqlrow.process_time;
        this.des  = sqlrow.description;
        this.enrol_l = sqlrow.enrol_link;
        this.tc_l = sqlrow.terms_c_link;
    }
    static createTable(){
        return `CREATE TABLE IF NOT EXISTS ${tblname} (
            pid TEXT NOT NULL PRIMARY KEY,
            userid TEXT NOT NULL,
            name TEXT NOT NULL,
            currency TEXT NOT NULL,
            process_time TEXT NOT NULL,
            description TEXT NOT NULL,
            enrol_link TEXT NOT NULL,
            terms_c_link TEXT NOT NULL,
            FOREIGN KEY (userid)
                REFERENCES users(hashed_id)
                    ON UPDATE RESTRICT
                    ON DELETE CASCADE
        );`;
    }
    updateSQL(){
        //TODO dynamically create the sql 
        return `UPDATE ${tblname}
            SET name = ${this.name},
                currency = ${this.cur_name},
                process_time = ${this.p_time},
                description = ${this.des},
                enrol_link = ${this.enrol_l},
                terms_c_link = ${this.tc_l}
            WHERE 
                pid = ${this.pid};`
    }
    insertSQL(userid){
        return `INSERT INTO ${tblname} (pid, userid, name, currency, process_time, description, enrol_link, terms_c_link)
        VALUES ('${this.pid}','${userid}','${this.name}','${this.cur_name}','${this.p_time}','${this.des}','${this.enrol_l}','${this.terms_c_link}');`
    }
}

function createTable(){
    return LoyaltyProgramInfo.createTable();
}

async function update_loyalty_program(dto,success,fail){
    try{
        if(!dto['pid']) throw 'No PID';
        db.get(`SELECT * FROM loyalty_programs WHERE pid = ?`,[dto['pid']],(err,row)=>{
            if(err||!row){
                err = {error:'Something went wrong'};
                return fail(err);
            }
            db.serialize(()=>{
                db.run(new LoyaltyProgramInfo(dto).updateSQL(),(err)=>{
                    if(err){
                        return fail(err);
                    }
                    return success(`updated: ${dto['pid']}`);
                });
            });
        }); 
    }   
    catch(err){
        fail(err);
    }
}

async function get_loyalty_program(pidlist,callback){
    db.all(`SELECT * FROM ${tblname} 
        WHERE pid IN (${pidlist.map((v)=>{return `"${v}"`})})`,(err,rows)=>{
        callback(err,rows);
    });
}

const LoyaltyPrograms = {InfoObject:LoyaltyProgramInfo,update_loyalty_program:update_loyalty_program,createTable:createTable,get_loyalty_program:get_loyalty_program};
module.exports = LoyaltyPrograms;