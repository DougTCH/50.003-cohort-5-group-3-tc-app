const db = require('../services/db_adaptor.js');
const { v4: uuidv4 } = require('uuid'); // Import the UUID library
const tblname = 'transaction_records';

class TransactionRecord {
    constructor(sqlrow) {
        this.t_id = sqlrow.t_id || uuidv4(); // Generate a new UUID if not provided
        this.app_id = sqlrow.app_id;
        this.loyalty_pid = sqlrow.loyalty_pid;
        this.user_id = sqlrow.user_id;
        this.member_id = sqlrow.member_id;
        this.member_name = sqlrow.member_name;
        this.transaction_date = sqlrow.transaction_date; // Ensure this is in the form of YYYYMMDD eg. 20210911 for 11th September 2021
        this.reference_number = sqlrow.reference_number;
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
            member_id INTEGER NOT NULL,
            member_name TEXT NOT NULL,
            transaction_date TEXT NOT NULL CHECK(transaction_date GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
            reference_number TEXT NOT NULL UNIQUE,
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
                member_name = ?,
                transaction_date = ?,
                amount = ?,
                status = ?,
                additional_info = ?
            WHERE 
                reference_number = ?;`;
    }

    insertSQL() {
        return `INSERT INTO ${tblname} (t_id, app_id, loyalty_pid, user_id, member_id, member_name, transaction_date, reference_number, amount, status, additional_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
    }

    static getLastStatusRecord(status, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE status = ? ORDER BY transaction_date DESC LIMIT 1`;
        db.get(sql, [status], (err, row) => {
            if (err) {
                console.error(`Error fetching last record with status ${status}:`, err);
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

    static addTransaction(transactionData, callback) {
        if (!/^\d{8}$/.test(transactionData.transaction_date)) {
            return callback(new Error('Invalid transaction_date format. It should be YYYYMMDD.'));
        }

        if (isNaN(transactionData.member_id)) {
            return callback(new Error('Invalid member_id. It should be a number.'));
        }

        if (!transactionData.reference_number) {
            return callback(new Error('reference_number is required.'));
        }

        const transaction = new TransactionRecord(transactionData);

        const sql = transaction.insertSQL();
        console.log('Executing SQL:', sql);

        db.run(sql, [
            transaction.t_id,
            transaction.app_id,
            transaction.loyalty_pid,
            transaction.user_id,
            transaction.member_id,
            transaction.member_name,
            transaction.transaction_date,
            transaction.reference_number,
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

    static getAllRecordByStatus(status, callback) {
        const sql = `SELECT t_id FROM ${tblname} WHERE status = ? ORDER BY transaction_date ASC`;
        db.all(sql, [status], (err, rows) => {
            if (err) {
                console.error(`Error fetching all records with status ${status}:`, err);
                return callback(err);
            }
            callback(null, rows.map(row => row.t_id));
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

function createTable() {
    return TransactionRecord.createTable();
}

async function update_transaction_record(dto, success, fail) {
    try {
        if (!dto['reference_number']) throw 'No reference number';
        db.get(`SELECT * FROM ${tblname} WHERE reference_number = ?`, [dto['reference_number']], (err, row) => {
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
                    dto.member_name,
                    dto.transaction_date,
                    dto.amount,
                    dto.status,
                    dto.additional_info,
                    dto.reference_number
                ], (err) => {
                    if (err) {
                        console.error('Error updating transaction:', err);
                        return fail(err);
                    }
                    return success(`updated: ${dto['reference_number']}`);
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
    createTable 
};
