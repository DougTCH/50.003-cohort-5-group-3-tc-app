const db = require('../services/db_adaptor.js');
const LoyaltyPrograms = require('../models/loyalty.js');
//const BankAppInfo = require('../models/bank.js');
const {TransactionRecord,tblname} = require('../models/transactions.js'); 
const {parse} =require('csv-parse');
const SFTPService = require('../services/sftp_client.js');

const fs = require('fs');
const params = require('../config_helper.js').get_app_config();
const remotedir = params["sftp"].params.HandbackPath;
const workingdir = params["sftp"].params.TempPath;
class Handback{
     constructor(dto){
//           Transfer date 
// Format YYYY-MM-DD 
// 2020-08-01
// Amount 
// Number of points/ miles 
// 10000
// Reference number 
// System reference number during request 
// 2020080101
// Outcome code 


// 0000 - success 
// 0001 - member not found 
// 0002 - member name mismatch 
// 0003 - member account closed 
// 0004 - member account suspended 
// 0005 - member ineligible for accrual 
// 0099 - unable to process, please contact 
// support for more information 
          this.date = dto.transfer_date;
          this.amount = dto.amount;
          this.ref_uuid = dto.ref_num;
          this.outcome = dto.outcome_code;
     }
}
function notify_record(record){
     console.log(`Placeholder - Notify APP: ${record.app_id}, RID: ${record.t_id}`);
}

function connect_wrapper(args,next){
     SFTPService.Client.connect(SFTPService.Client.params).then(()=>{
          var files = SFTPService.Client.listFiles(remotedir);
          for(f of files){
               try{
                    var fpname =  `${remotedir}${f}`;
                    SFTPService.Client.downloadFile(fpname,workingdir+f).then(()=>{
                         var buff = fs.readFileSync(workingdir+f);
                         var recs = parse(buff);
                         for(r of recs){
                              var h = new Handback(r);
                              if(h.ref_uuid in args){
                                   args[h.ref_uuid].outcome = h.outcome;
                                   notify_record(args[h.ref_uuid]);
                              }
                         }
                         console.log(buff);
                         //Handback here
                         //SFTPService.Client.deleteFile(``);
                    });
               }catch(err){
                    console.error(err);
               }
          }
          resolve(args);
     }).then((args)=>{next(args)});
     ;
}

function update_rows(transactionRecords){
     for(r of transactionRecords){
          db.run(r.updateSQL(),(err,res)=>{
               if(err)console.error(err);
          });
     }
}

async function get_handback_job(){
     const t_recs=new Map();
     db.run(TransactionRecord.getAllRecordByStatus('pending'),(err,rows)=>{
          var rObj = rows.map(row=>new TransactionRecord(row));
          for(o of rObj){
               t_recs.set(o.t_id,o);
          }
     }).then(()=>{
          connect_wrapper(t_recs,update_rows);
     });
}

module.exports = get_handback_job;