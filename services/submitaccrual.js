const db = require('./db_adaptor.js');
const LoyaltyPrograms = require('../models/loyalty.js');
const BankAppInfo = require('../models/bank.js');
const {TransactionRecord,tblname} = require('../models/transactions.js'); 
const {stringify} =require('csv-stringify');
//const SFTPService = require('./services/sftp_client.js');

//const SFTPService = require('./services/sftp_client.js');
const fs = require('fs');
db.all(`SELECT * FROM ${LoyaltyPrograms.tblname}`,(err,rows)=>{
     if(err){ console.error(err);throw err;}
     var progs = {}
     //console.error(rows);
     for(var r of rows){
      //    console.error(r)
          progs[r.pid] = {program:new LoyaltyPrograms.InfoObject(r),arr:[['index','Member ID','Member first name','Member last name','Transfer date','Amount','Reference number','Partner code']]}; 
     }
     
     db.all(`SELECT * FROM ${tblname} WHERE status = "pending"`, (err,innerrows)=>{
          if(err)throw err;
          for(var ir of innerrows){
               progs[ir.loyalty_pid].arr.push(new TransactionRecord(ir));
          }
          // console.log("PRINTPRINt")
          //console.log(progs);
          filearr=[]
          for(var [k,p] of Object.entries(progs)){
               if(!p.arr) continue;
               try{                    
                    stringify(
                         p.arr.map((r,idx)=>{if(idx==0){ return r;} return r.getAccrualRow(idx);})
                    ,(err,output)=>{
                         if(err) throw err;
                         var date = new Date();
                         fs.writeFileSync(`${k}_ACCRUAL_${date.getFullYear()}${date.getMonth()+1}${date.getDate()}.csv`,output);
                         
                         //SFTPService.Client.connect(SFTPService.Client.params);
                         //SFTPService.Client.uploadFile(output,`/sutd_project_2024/c5g3/Accrual/${p.lp.pid}_ACCRUAL_${date.getFullYear()}${date.getMonth()+1}${date.getDate()}.csv`);
                         
                    });
               }catch(err){
                    console.error(err);
               }
          }
     });
})

