const db = require('../services/db_adaptor.js');
const LoyaltyPrograms = require('../models/loyalty.js');
const { TransactionRecord, tblname } = require('../models/transactions.js'); 
const { stringify } = require('csv-stringify');
const SFTPService = require('../services/sftp_client.js');
const fs = require('fs');
const params = require('../config_helper.js').get_app_config();

async function submit_accrual_job() {
    try {
        // Fetch loyalty programs
        const loyaltyProgramsRows = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM ${LoyaltyPrograms.tblname}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        let progs = {};

        // Initialize the programs with headers
        for (const r of loyaltyProgramsRows) {
            progs[r.pid] = {
                program: new LoyaltyPrograms.InfoObject(r),
                arr: [['index', 'Member ID', 'Member first name', 'Member last name', 'Transfer date', 'Amount', 'Reference number', 'Partner code']]
            };
        }

        // Fetch pending transactions
        const pendingTransactionsRows = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM ${tblname} WHERE status = "pending"`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        // Add transactions to corresponding programs
        for (const ir of pendingTransactionsRows) {
            if (progs[ir.loyalty_pid]) {
                progs[ir.loyalty_pid].arr.push(new TransactionRecord(ir));
            } else {
               console.warn(ir.loyalty_pid);
                console.warn(`Loyalty program ID ${ir.loyalty_pid} not found for transaction ${ir.ref_num}`);
            }
        }

        // Process and upload files for each program
        for (const [k, p] of Object.entries(progs)) {
            if (p.arr.length > 1) { // Check if there are any transactions (length > 1 because of the header)
                try {
                    stringify(
                        p.arr.map((r, idx) => {
                            if (idx === 0) {
                                return r;
                            }
                            return r.getAccrualRow(idx);
                        }),
                        (err, output) => {
                            if (err) throw err;
                            const date = new Date();
                            const localpath = './AccrualFiles/';
                            const fn = `${k}_ACCRUAL_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.csv`;
                            fs.writeFileSync(`${localpath}${fn}`, output);
                            SFTPService.Client.connect(SFTPService.Client.params).then(() => {
                                SFTPService.Client.uploadFile(`${localpath}${fn}`, `${params['sftp'].params.AccrualPath}${fn}`).then(
                                    () => {
                                        SFTPService.Client.disconnect();
                                    }
                                );
                                // Need 'receipt'
                            });
                        }
                    );
                } catch (err) {
                    console.error(err);
                }
            }
        }
    } catch (err) {
        console.error('Error in submit_accrual_job:', err);
    }
}

module.exports = submit_accrual_job;
