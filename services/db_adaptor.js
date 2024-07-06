var sqlite3 = require('sqlite3').verbose();
//TODO use diff file open modes
let db = new sqlite3.Database('./tc.db',(err)=>{
    if (err) {
        console.error(err.message);
      }
      console.log('Connected to the Transfer Connect DB File Mode');
});

module.exports = db;
