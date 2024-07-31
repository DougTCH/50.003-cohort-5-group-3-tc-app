const db = require('../services/db_adaptor.js');
const LoyaltyPrograms = require('../models/loyalty.js');
const { TransactionRecord, tblname } = require('../models/transactions.js'); 
const { stringify } = require('csv-stringify/sync');
const SFTPService = require('../services/sftp_client.js');
const fs = require('fs');
const { join } = require('node:path');

async function submit_accrual_job(){

     db.all(`SELECT * FROM ${LoyaltyPrograms.tblname}`,async (err,rows)=>{
          if(err){ console.error(err);throw err;}
          var progs = {}
          //console.error(rows);
          for(var r of rows){
               progs[r.pid] = {program:new LoyaltyPrograms.InfoObject(r),arr:[['index','Member ID','Member first name','Member last name','Transfer date','Amount','Reference number','Partner code']]}; 
          }
          db.all(`SELECT * FROM ${tblname} WHERE status = "pending"`, async (err,innerrows)=>{
               if(err)throw err;
               for(var ir of innerrows){
                    if(!(ir.loyalty_pid in progs)){
                         continue;
                    }
                    progs[ir.loyalty_pid].arr.push(new TransactionRecord(ir));
                    //console.log(`Push into progs ${ir.loyalty_pid}`);
               }

               const filelist = []
               for(var [k,p] of Object.entries(progs)){
                    //console.log(k);
                    if(!p.arr) continue;
                    try{ 
                         var nl = p.arr.map((r,idx)=>{
                              if(idx==0){ return r;} 
                              //else{console.log(r.getAccrualRow(idx)) }
                              return r.getAccrualRow(idx);
                    });                  
                         const st = stringify(nl);
                         const date = new Date();
                         let localpath ='./AccrualFiles/'; 
                         const fn =`${k}_ACCRUAL_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.txt`;
                         fs.writeFileSync(`${localpath}${fn}`,st);
                         filelist.push(`${fn}`);
                         }
                    catch(err){
                         console.error(err);
                    }
               }
               await SFTPService.Client.connect(SFTPService.Client.params);
               for(f of filelist){
                    try{
                         await SFTPService.Client.client.fastPut(`./AccrualFiles/${f}`,join(SFTPService.Client.params.acc_path,f));
                    }catch(err){
                         console.error(`${f}  ${err}`);
                    }
               }
               await SFTPService.Client.disconnect();
          });
     });
}

module.exports = submit_accrual_job;
