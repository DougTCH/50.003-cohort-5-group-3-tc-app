
const db = require('../services/db_adaptor.js');

class LoyaltyProgramInfo{
    // constructor(id,name,cur_name,p_time,des,enrol_l,tc_l){
    //     this.pid = id;
    //     this.name = name;
    //     this.cur_name = cur_name;
    //     this.p_time = p_time;
    //     this.des  = des;
    //     this.enrol_l = enrol_l;
    //     this.tc_l = tc_l;
    // }
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
        return `CREATE TABLE IF NOT EXISTS loyalty_programs (
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
    updateSQL(dto){
        //TODO dynamically create the sql 
        for(const prop in dto){

        }
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
                new LoyaltyProgramInfo(row).updateSQL(dto);
            });

        }); 
    }   
    catch(err){
        fail(err);
    }
}

const LoyaltyPrograms = {InfoObject:LoyaltyProgramInfo,update_loyalty_program:update_loyalty_program,createTable:createTable};
module.exports = LoyaltyPrograms;