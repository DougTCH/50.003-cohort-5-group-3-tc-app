const db = require('../services/db_adaptor.js');
// const LoyaltyPrograms = require('../models/loyalty.js');
// //const BankAppInfo = require('../models/bank.js');
const {TransactionRecord,tblname} = require('../models/transactions.js'); 
const {parse} =require('csv-parse/sync');
const SFTPService = require('../services/sftp_client.js');
const { join } = require('node:path');
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
          this.ref_uuid = dto.reference_number;
          this.outcome = dto.outcome_code;
     }
     static get_csv_header(){
          return "transfer_date,amount,reference_number,outcome_code\n";
     }
}
function notify_record(record){
     console.log(`Placeholder - Notify APP: ${record.app_id}, RID: ${record.t_id}`);
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
     console.log("Get Handback Job Triggered");
     toprocess = []
     try{
          await SFTPService.Client.connect(SFTPService.Client.params);
          const fileList = await SFTPService.Client.client.list(SFTPService.Client.params.hb_path);
          for(let fn of fileList){
               //await SFTPService.Client.client.fastGet(join(SFTPService.Client.params.hb_path,fn.name),`./HandBackFiles/${fn.name}`);
               toprocess.push(`./HandBackFiles/${fn.name}`);
          }
     }catch(err){
          console.error(err);
     }finally{
          await SFTPService.Client.disconnect();
     }
     
     hbfs = []
     var c = 0;
     for(let fn of toprocess){
          for(let hbr of parse(fs.readFileSync(fn),
          {
               columns: true,
               skip_empty_lines: true
          })){
               c++;     
               hbfs.push(new Handback(hbr));
          }
     }
     console.error("COUNT: " + c);

     TransactionRecord.getAllRecordByStatus('pending',(err,rows)=>{
          if(err){
               console.error(err);
               return;
          }
          var rObj = rows.map(row=>new TransactionRecord(row));
          for(o of rObj){
               //console.log("id: " + o.t_id);
               t_recs.set(o.t_id,o);
          }
          //console.log(t_recs);
          for(let hbf of hbfs){
               if(t_recs.has(hbf.ref_uuid)){
                    let tt = t_recs.get(hbf.ref_uuid);
                    tt.status = hbf.outcome;
                    //console.log(tt.updateSQL());
                    db.run(`UPDATE ${tblname}
                         SET status = '${tt.status}'
                         WHERE t_id = '${tt.t_id}';`,[],(err,res)=>{
                         if(err)console.error(err);
                         return;
                    });
               }
          }
          console.log("Complete handback processing in DB");
     });

     // db.run(TransactionRecord.getAllRecordByStatus('pending'),(err,rows)=>{
     //     
     // }).then(()=>{
     //      connect_wrapper(t_recs,update_rows);
     // });
}


module.exports = get_handback_job;
