const db = require('../services/db_adaptor.js');
const LoyaltyPrograms = require('../models/loyalty.js');
//const BankAppInfo = require('../models/bank.js');
const {TransactionRecord,tblname} = require('../models/transactions.js'); 
const {stringify} =require('csv-stringify');
const SFTPService = require('../services/sftp_client.js');
const fs = require('fs');
const params = require('../config_helper.js').get_app_config();

async function submit_accrual_job(){
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
               filearr=[]
               for(var [k,p] of Object.entries(progs)){
                    if(!p.arr) continue;
                    try{                    
                         stringify(
                              p.arr.map((r,idx)=>{if(idx==0){ return r;} return r.getAccrualRow(idx);})
                         ,(err,output)=>{
                              if(err) throw err;
                              var date = new Date();
                              var localpath ='./AccrualFiles/'; 
                              var fn =`${k}_ACCRUAL_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.txt`;
                              fs.writeFileSync(`${localpath}${fn}`,output);
                              SFTPService.Client.connect(SFTPService.Client.params).then(()=>{
                                   SFTPService.Client.uploadFile(`${localpath}${fn}`,`${params['sftp'].params.AccrualPath}${fn}`).then(
                                        ()=>{
                                             SFTPService.Client.disconnect();
                                        }
                                   );
                                   //Need 'recipt'
                              });  
                         });
                    }catch(err){
                         console.error(err);
                    }
               }
          });
     });
}
//submit_accrual_job();
module.exports = submit_accrual_job;