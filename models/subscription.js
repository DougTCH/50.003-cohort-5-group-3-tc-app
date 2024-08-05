const db = require('../services/db_adaptor.js');
const tblname = 'subscriptions';
const webpush = require('web-push');

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
};

const sendNotification = (ref_num, callback) => {
    Subscription.getSubscriptionByRefNum(ref_num, (err, subscription) => {
        if (err) {
            return callback({ status: 500, error: 'Database error' });
        }
        if (!subscription) {
            return callback({ status: 404, error: 'Subscription not found' });
        }

        const payload = JSON.stringify({
            title: 'Push Notification Title',
            body: 'This is the body of the push notification',
            icon: 'path/to/icon.png'
        });

        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        };

        webpush.sendNotification(pushSubscription, payload)
            .then(result => callback(null, { status: 200, message: 'Notification sent', result }))
            .catch(err => callback({ status: 500, error: 'Failed to send notification', details: err }));
    });
};

module.exports = {
    Subscription,
    createTable: Subscription.createTable,
    sendNotification
};