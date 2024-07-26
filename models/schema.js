const {User} = require('./user.js');
const LoyaltyPrograms = require('./loyalty.js');
const db = require('../services/db_adaptor.js');
const TransactionRecord = require('./transactions.js');
const BankAppModel = require('./bank.js');

async function build_schema(){
    db.serialize(()=>{
        db.run(User.createTable());
        db.run(LoyaltyPrograms.createTable());
        db.run(TransactionRecord.createTable());
        db.run(BankAppModel.BankAppInfo.createTable());
    });
}

module.exports = build_schema;