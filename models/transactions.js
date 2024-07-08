const db = require('../services/db_adaptor.js');
const tblname = 'transaction_records';

class TransactionRecord {
    constructor(sqlrow) {
        this.tid = sqlrow.tid;
        this.userid = sqlrow.userid;
        this.amount = sqlrow.amount;
        this.currency = sqlrow.currency;
        this.timestamp = sqlrow.timestamp;
        this.loyalty_pid = sqlrow.loyalty_pid;
        this.status = sqlrow.status;
    }

    static createTable() {
        return `CREATE TABLE IF NOT EXISTS ${tblname} (
            tid TEXT NOT NULL PRIMARY KEY,
            userid TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            loyalty_pid TEXT,
            status TEXT NOT NULL,
            FOREIGN KEY (userid)
                REFERENCES users(hashed_id)
                    ON UPDATE RESTRICT
                    ON DELETE CASCADE,
            FOREIGN KEY (loyalty_pid)
                REFERENCES loyalty_programs(pid)
                    ON UPDATE RESTRICT
                    ON DELETE SET NULL
        );`;
    }

    updateSQL() {
        return `UPDATE ${tblname}
            SET userid = '${this.userid}',
                amount = ${this.amount},
                currency = '${this.currency}',
                timestamp = '${this.timestamp}',
                loyalty_pid = '${this.loyalty_pid}',
                status = '${this.status}'
            WHERE 
                tid = '${this.tid}';`
    }

    insertSQL() {
        return `INSERT INTO ${tblname} (tid, userid, amount, currency, timestamp, loyalty_pid, status)
        VALUES ('${this.tid}', '${this.userid}', ${this.amount}, '${this.currency}', '${this.timestamp}', '${this.loyalty_pid}', '${this.status}');`
    }
}

function createTable() {
    return TransactionRecord.createTable();
}

async function update_transaction_record(dto, success, fail) {
    try {
        if (!dto['tid']) throw 'No TID';
        db.get(`SELECT * FROM ${tblname} WHERE tid = ?`, [dto['tid']], (err, row) => {
            if (err || !row) {
                err = { error: 'Something went wrong' };
                return fail(err);
            }
            db.serialize(() => {
                db.run(new TransactionRecord(dto).updateSQL(), (err) => {
                    if (err) {
                        return fail(err);
                    }
                    return success(`updated: ${dto['tid']}`);
                });
            });
        });
    } catch (err) {
        fail(err);
    }
}

const TransactionRecords = { InfoObject: TransactionRecord, update_transaction_record: update_transaction_record, createTable: createTable };
module.exports = TransactionRecords;
