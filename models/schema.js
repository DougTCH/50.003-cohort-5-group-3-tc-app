const {User,createUser} = require('./user.js');
const db = require('../services/db_adaptor.js');


function build_schema(){
    db.serialize(()=>{
        db.run(User.createTable());
    });
    
}

module.exports = build_schema;