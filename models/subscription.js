const db = require('../services/db_adaptor.js');
const tblname = 'subscriptions';

class Subscription {
    constructor(sqlrow) {
        this.ref_num = sqlrow.ref_num;
        this.endpoint = sqlrow.endpoint;
        this.p256dh = sqlrow.p256dh;
        this.auth = sqlrow.auth;
    }

    static createTable() {
        return `CREATE TABLE IF NOT EXISTS ${tblname} (
            ref_num TEXT PRIMARY KEY,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            FOREIGN KEY (ref_num)
                REFERENCES transaction_records(ref_num)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
        );`;
    }

    static addSubscription(subscriptionData, callback) {
        console.log('Adding subscription:', subscriptionData);
        const sql = `INSERT INTO ${tblname} (ref_num, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`;
        db.run(sql, [
            subscriptionData.ref_num,
            subscriptionData.endpoint,
            subscriptionData.p256dh,
            subscriptionData.auth
        ], function(err) {
            if (err) {
                console.error('Error adding subscription:', err);
                return callback(err);
            }
            callback(null, { message: 'Subscription added', ref_num: subscriptionData.ref_num });
        });
    }

    static getSubscriptionByRefNum(ref_num, callback) {
        const sql = `SELECT * FROM ${tblname} WHERE ref_num = ?`;
        db.get(sql, [ref_num], (err, row) => {
            if (err) {
                console.error('Error fetching subscription by ref_num:', err);
                return callback(err);
            }
            if (row) {
                callback(null, new Subscription(row));
            } else {
                callback(null, null);
            }
        });
    }
}

module.exports = { 
    Subscription, 
    createTable: Subscription.createTable
};
