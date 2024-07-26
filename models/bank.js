const db = require('../services/db_adaptor.js');
const tblname = 'bank_apps';

class BankAppInfo{
    constructor(sqlrow){
        this.pid = sqlrow.pid;
        this.name = sqlrow.name;
        this.valid_lp = sqlrow.valid_lp;
    }
    static createTable(){
        return `CREATE TABLE IF NOT EXISTS ${tblname} (
            pid TEXT NOT NULL PRIMARY KEY,
            name TEXT NOT NULL,
            valid_lp TEXT NOT NULL     
        );`;//valid_lp is a json array
    }
    updateSQL(){
        //TODO dynamically create the sql 
        return `UPDATE ${tblname}
            SET name = ${this.name},
                valid_lp = ${this.valid_lp}
            WHERE 
                pid = ${this.pid};`
    }
    insertSQL(){
        return `INSERT INTO ${tblname} (pid,name,valid_lp)
        VALUES ('${this.pid}','${this.name}','${this.valid_lp}');`
    }
    getLPArray(){
        return this.valid_lp.split(',');
    }
    updateLPArray(arr){
        this.valid_lp = JSON.stringify(arr);
    }
}

async function getBankAppInfo(pid,callback){
    db.get(`SELECT * FROM ${tblname} WHERE pid = '${pid}'`,(err,row)=>{
        //console.log(pid+' '+row.valid_lp);
        if(err) return callback(err,pid);
        if(row) return callback(null,new BankAppInfo(row));
        return callback('Not found',null);
    });
}

module.exports = BankAppModel = {getBankAppInfo:getBankAppInfo,BankAppInfo:BankAppInfo};