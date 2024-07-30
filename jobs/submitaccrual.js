const db = require('../services/db_adaptor.js');
const LoyaltyPrograms = require('../models/loyalty.js');
const { TransactionRecord, tblname } = require('../models/transactions.js'); 
const { stringify } = require('csv-stringify/sync');
const SFTPService = require('../services/sftp_client.js');
const fs = require('fs');
const params = require('../config_helper.js').get_app_config();

async function submit_accrual_job(){
     db.all(`SELECT * FROM ${LoyaltyPrograms.tblname}`,(err,rows)=>{
          if(err){ console.error(err);throw err;}
          var progs = {}
          //console.error(rows);
          for(var r of rows){
               progs[r.pid] = {program:new LoyaltyPrograms.InfoObject(r),arr:[['index','Member ID','Member first name','Member last name','Transfer date','Amount','Reference number','Partner code']]}; 
          }
          db.all(`SELECT * FROM ${tblname} WHERE status = "pending"`, (err,innerrows)=>{
               if(err)throw err;
               for(var ir of innerrows){
                    if(!(ir.loyalty_pid in progs)){
                         continue;
                    }
                    progs[ir.loyalty_pid].arr.push(new TransactionRecord(ir));
                    //console.log(`Push into progs ${ir.loyalty_pid}`);
               }
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
                         var date = new Date();
                         var localpath ='./AccrualFiles/'; 
                         var fn =`${k}_ACCRUAL_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.txt`;
                         fs.writeFileSync(`${localpath}${fn}`,st);
                         SFTPService.Client.connect(SFTPService.Client.params).then(()=>{
                              SFTPService.Client.uploadFile(`${localpath}${fn}`,`${params['sftp'].params.AccrualPath}${fn}`).then(
                                   ()=>{
                                        SFTPService.Client.disconnect();
                                   }
                              );
                         });  
                         }
                    catch(err){
                         console.error(err);
                    }
               }
          });
     });
}

module.exports = submit_accrual_job;
