var app_config = require('../config_helper.js').get_app_config(true);
var con_str = app_config["database"].connection_str;
var sqlite3 = require('sqlite3').verbose();
//TODO use diff file open modes

let db = new sqlite3.Database(con_str,(err)=>{
    if (err) {
        console.error(err.message);
      }
      //console.log('Connected to the Transfer Connect DB File Mode');
});
//console.log(con_str);
module.exports = db;
