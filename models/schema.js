const {User} = require('./user.js');
const LoyaltyPrograms = require('./loyalty.js');
const db = require('../services/db_adaptor.js');


async function build_schema(){
    db.serialize(()=>{
        db.run(User.createTable());
        db.run(LoyaltyPrograms.createTable());
    });
}

module.exports = build_schema;