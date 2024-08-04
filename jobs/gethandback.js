const db = require('../services/db_adaptor.js');
// const LoyaltyPrograms = require('../models/loyalty.js');
// //const BankAppInfo = require('../models/bank.js');

const {TransactionRecord,tblname} = require('../models/transactions.js'); 
const {parse} =require('csv-parse/sync');
const SFTPService = require('../services/sftp_client.js');
const { join } = require('node:path');
const fs = require('fs');
const { config } = require('dotenv');
const params = require('../config_helper.js').get_app_config();
const remotedir = params["sftp"].params.HandbackPath;
const workingdir = params["sftp"].params.TempPath;
const { Subscription } = require('../models/subscription.js');
const webpush = require('web-push');
const dotenv = require('dotenv');
dotenv.config();
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
webpush.setVapidDetails('mailto:your-email@example.com', publicVapidKey, privateVapidKey);

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
function notify_record(subscription, payload) {
     webpush.sendNotification(subscription, payload).catch(error => {
         console.error('Error sending notification:', error);
         if (error.statusCode === 410 || error.statusCode === 404) {
             Subscription.removeSubscriptionByRefNum(subscription.ref_num, err => {
                 if (err) {
                     console.error('Error removing subscription:', err);
                 }
             });
         }
     });
 }
async function processTransactions(t_recs, hbfs) {
    for (let hbf of hbfs) {
        if (t_recs.has(hbf.ref_uuid)) {
            let tt = t_recs.get(hbf.ref_uuid);
            tt.status = hbf.outcome;
            db.run(`UPDATE ${tblname} SET status = '${tt.status}' WHERE t_id = '${tt.t_id}';`, [], async (err) => {
                if (err) console.error(err);

                // Fetch the corresponding subscription and send notification
                Subscription.getSubscriptionByRefNum(tt.ref_num, (err, subscription) => {
                    if (err) {
                        console.error('Error fetching subscription:', err);
                        return;
                    }
                    if (subscription) {
                        const payload = JSON.stringify({
                            title: 'Transaction Status',
                            body: `Transaction ${tt.ref_num} ${tt.status}`
                        });
                        notify_record(subscription, payload);
                    }
                });
            });
        }
    }
    console.log("Complete processTransactions in DB");
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
     await processTransactions(t_recs, hbfs);
     console.log("Complete get_handback_job");
}


module.exports = get_handback_job;
