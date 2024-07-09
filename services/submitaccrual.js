const db = require('./db_adaptor.js');
let tblname = require('../models/transactions.js');
//const SFTPService = require('./services/sftp_client.js');

let partners =  db.get()

db.parallelize(()=>{
     db.run(`SELECT * FROM ${tblname} WHERE loyalty_pid = `);

});