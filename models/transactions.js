const db = require('../services/db_adaptor.js');
const { v4: uuidv4 } = require('uuid'); // Import the UUID library
const tblname = 'transaction_records';

class TransactionRecord {
    constructor(sqlrow) {
        this.t_id = sqlrow.t_id || uuidv4().replace(/-/gi, ''); // Generate a new UUID if not provided
        this.app_id = sqlrow.app_id;
        this.loyalty_pid = sqlrow.loyalty_pid;
        this.user_id = sqlrow.user_id;
        this.member_id = sqlrow.member_id;
        this.member_first = sqlrow.member_first;
        this.member_last = sqlrow.member_last;
        this.transaction_date = sqlrow.transaction_date;
        this.ref_num = sqlrow.ref_num;
        this.amount = sqlrow.amount;
        this.status = sqlrow.status || 'pending'; // Default to 'pending'
        this.additional_info = sqlrow.additional_info;
    }


    static createTable() {
        return `CREATE TABLE IF NOT EXISTS ${tblname} (
            t_id TEXT PRIMARY KEY,
            app_id TEXT NOT NULL,
            loyalty_pid TEXT NOT NULL,
            user_id TEXT NOT NULL,
            member_id TEXT NOT NULL,
            member_first TEXT NOT NULL,
            member_last TEXT NOT NULL,
            transaction_date TEXT NOT NULL,
            ref_num TEXT NOT NULL UNIQUE,
            amount INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            additional_info TEXT CHECK(length(additional_info) <= 512),
            FOREIGN KEY (loyalty_pid)
                REFERENCES loyalty_programs(pid)
                    ON UPDATE RESTRICT
                    ON DELETE SET NULL,
            FOREIGN KEY (user_id)
                REFERENCES users(hashed_id)
                    ON UPDATE RESTRICT
                    ON DELETE SET NULL
        );`;
    }

    updateSQL() {
        return `UPDATE ${tblname}
            SET app_id = ?,
                loyalty_pid = ?,
                user_id = ?,
                member_id = ?,
                member_first = ?,
                member_last = ?,
                transaction_date = ?,
                amount = ?,
                status = ?,
                additional_info = ?
            WHERE 
                ref_num = ?;`;
    }

    insertSQL() {
        return `INSERT INTO ${tblname} (t_id, app_id, loyalty_pid, user_id, member_id, member_first,member_last, transaction_date, ref_num, amount, status, additional_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
    }
    getAccrualRow(idx){
        return [idx,this.member_id,this.member_first,this.member_last,this.transaction_date,this.amount,this.t_id,this.app_id];
    }

    static getAllRecordsByUserId(user_id, callback) {
        if (!user_id) {
            return callback(new Error('Invalid user_id'));
        }
    
        const sql = `SELECT * FROM ${tblname} WHERE user_id = ? ORDER BY transaction_date ASC`;
        db.all(sql, [user_id], (err, rows) => {
            if (err) {
                console.error(`Error fetching all records by user_id ${user_id}:`, err);
                return callback(err);
            }
            callback(null, rows.map(row => new TransactionRecord(row)));
        });
    }
    

    static getLastStatusRecord(statusCondition, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE status ${statusCondition} ORDER BY transaction_date DESC LIMIT 1`;
        db.get(sql, [], (err, row) => {
            if (err) {
                console.error(`Error fetching last record with status condition ${statusCondition}:`, err);
                return callback(err);
            }
            if (row) {
                callback(null, new TransactionRecord(row));
            } else {
                callback(null, null);
            }
        });
    }
    static getRecordById(t_id, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE t_id = ?`;
        db.get(sql, [t_id], (err, row) => {
            if (err) {
                console.error('Error fetching record by transaction ID:', err);
                return callback(err);
            }
            if (row) {
                callback(null, new TransactionRecord(row));
            } else {
                callback(null, null);
            }
        });
    }
    static getRecordByReferenceNumber(ref_num, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE ref_num = ?`;
        db.get(sql, [ref_num], (err, row) => {
            if (err) {
                console.error('Error fetching record by reference number:', err);
                return callback(err);
            }
            if (row) {
                console.log(row);                
                callback(null, new TransactionRecord(row));
            } else {
                console.log('no record found');
                callback(null, null);
            }
        });
    }

    static checkValidity(transactionData,callback){
        if (!isValidDate(transactionData.transaction_date)) {
            callback(new Error('Invalid transaction_date format. It should be YYYYMMDD.'));
            return false;
        }
        if (!transactionData.ref_num) {
            callback(new Error('ref_num is required.'));
            return false;
        }
        if (transactionData.amount<=0||isNaN(transactionData.amount)) {
            callback(new Error('Transaction amount is invalid.'));
            return false;
        }
        return true;
    }

    static addTransaction(transactionData, callback) {
        
        if(!TransactionRecord.checkValidity(transactionData,callback)){
            return false;
        }
        //Check against bank app valid lp
        const transaction = new TransactionRecord(transactionData);

        const sql = transaction.insertSQL();
        //console.log('Executing SQL:', sql);
        db.run(sql, [
            transaction.t_id,
            transaction.app_id,
            transaction.loyalty_pid,
            transaction.user_id,
            transaction.member_id,
            transaction.member_first,
            transaction.member_last,
            transaction.transaction_date,
            transaction.ref_num,
            transaction.amount,
            transaction.status,
            transaction.additional_info
        ], function(err) {
            if (err) {
                console.error('Error adding transaction:', err);
                return callback(err);
            }
            callback(null, { message: 'Transaction added', t_id: transaction.t_id });
        });
    }

    static removeTransaction(t_id, callback) {
        const sql = `DELETE FROM ${tblname} WHERE t_id = ?`;
        db.run(sql, [t_id], function(err) {
            if (err) {
                console.error('Error removing transaction:', err);
                return callback(err);
            }
            callback(null, { message: 'Transaction removed', changes: this.changes });
        });
    }
    static removeTransactionByRefNum(ref_num, callback) {
        const sql = `DELETE FROM ${tblname} WHERE ref_num = ?`;
        db.run(sql, [ref_num], function(err) {
            if (err) {
                console.error('Error removing transaction:', err);
                return callback(err);
            }
            callback(null, { message: 'Transaction removed', changes: this.changes });
        });
    }

    static updateTransactionStatus(t_id, status, callback) {
        const sql = `UPDATE ${tblname} SET status = ? WHERE t_id = ?`;
        db.run(sql, [status, t_id], function(err) {
            if (err) {
                console.error('Error updating transaction status:', err);
                return callback(err);
            }
            callback(null, { message: 'Transaction status updated', t_id });
        });
    }

    static updateTransactionsStatus(t_ids, status, callback) {
        const placeholders = t_ids.map(() => '?').join(',');
        const sql = `UPDATE ${tblname} SET status = ? WHERE t_id IN (${placeholders})`;
        db.run(sql, [status, ...t_ids], function(err) {
            if (err) {
                console.error('Error updating transactions statuses:', err);
                return callback(err);
            }
            callback(null, { message: 'Transactions statuses updated', changes: this.changes });
        });
    }
    static getAllRecordByStatus(status, callback,full) {
        
        if(!full){
            return this.getAllRecordByStatus(status,callback);
        }
        const sql = `SELECT * FROM ${tblname} WHERE status = ? ORDER BY transaction_date ASC`;
        db.all(sql, [status], (err, rows) => {
            if (err) {
                console.error(`Error fetching all records with status ${status}:`, err);
                return callback(err);
            }
            callback(null, rows);
        });
    }
    static getAllRecordByStatus(statusCondition, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE status ${statusCondition} ORDER BY transaction_date ASC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(`Error fetching all records with status condition ${statusCondition}:`, err);
                return callback(err);
            }
            callback(null, rows.map(row => new TransactionRecord(row)));
        });
    }

    static getAllRecordsByMemberId(member_id, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE member_id = ? ORDER BY transaction_date ASC`;
        db.all(sql, [member_id], (err, rows) => {
            if (err) {
                console.error(`Error fetching all records by member_id ${member_id}:`, err);
                return callback(err);
            }
            callback(null, rows.map(row => new TransactionRecord(row)));
        });
    }

    static getRecordsByMemberIdAndStatus(member_id, status, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE member_id = ? AND status = ? ORDER BY transaction_date ASC`;
        db.all(sql, [member_id, status], (err, rows) => {
            if (err) {
                console.error(`Error fetching records by member_id ${member_id} with status ${status}:`, err);
                return callback(err);
            }
            callback(null, rows.map(row => new TransactionRecord(row)));
        });
    }
}
function isValidDate(dateString) {
    // Check if the date string matches the format YYYYMMDD
    if (!/^\d{8}$/.test(dateString)) {
        return false;
    }

    // Extract year, month, and day from the date string
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10);
    const day = parseInt(dateString.substring(6, 8), 10);

    // Check if month is valid
    if (month < 1 || month > 12) {
        return false;
    }

    // Check if day is valid based on the month and year
    const daysInMonth = [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (day < 1 || day > daysInMonth[month - 1]) {
        return false;
    }

    return true;
}

function isLeapYear(year) {
    // Leap year logic
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
function createTable() {
    return TransactionRecord.createTable();
}

async function update_transaction_record(dto, success, fail) {
    try {
        if (!dto['ref_num']) throw 'No reference number';
        db.get(`SELECT * FROM ${tblname} WHERE ref_num = ?`, [dto['ref_num']], (err, row) => {
            if (err || !row) {
                console.error('Error fetching record for update:', err || 'No record found');
                err = { error: 'Something went wrong' };
                return fail(err);
            }
            db.serialize(() => {
                db.run(new TransactionRecord(dto).updateSQL(), [
                    dto.app_id,
                    dto.loyalty_pid,
                    dto.user_id,
                    dto.member_id,
                    dto.member_first,
                    dto.member_last,
                    dto.transaction_date,
                    dto.amount,
                    dto.status,
                    dto.additional_info,
                    dto.ref_num
                ], (err) => {
                    if (err) {
                        console.error('Error updating transaction:', err);
                        return fail(err);
                    }
                    return success(`updated: ${dto['ref_num']}`);
                });
            });
        });
    } catch (err) {
        console.error('Error in update_transaction_record:', err);
        fail(err);
    }
}

module.exports = { 
    TransactionRecord, 
    update_transaction_record, 
    createTable,
    tblname
};
