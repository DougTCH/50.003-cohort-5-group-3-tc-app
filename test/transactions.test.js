const { 
    TransactionRecord, 
    update_transaction_record, 
    createTable,
    tblname
} = require('../models/transactions.js');
const { v4: uuidv4 } = require('uuid'); // Import the UUID library

describe("Transactions Model Test Suite",()=>{
    var record0 = {
        t_id: uuidv4(), // Generate a new UUID if not provided
        app_id : "DBSSG",
        loyalty_pid: "GOPOINTS",
        user_id : sqlrow.user_id,
        member_id : sqlrow.member_id,
        member_name : sqlrow.member_name,
        transaction_date : sqlrow.transaction_date,
        reference_number : sqlrow.reference_number,
        amount : sqlrow.amount,
        status : sqlrow.status || 'pending', // Default to 'pending'
        additional_info : sqlrow.additional_info
    };
});