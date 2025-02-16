const express = require('express');
const AuthMiddleware = require('../middleware/authMiddleware');
const { TransactionRecord } = require('../models/transactions.js');
const submit_accrual_job = require('../jobs/submitaccrual.js');
const get_handback_job = require('../jobs/gethandback.js');
const router = express.Router();


router.get('/obtain_record/byUserId', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const user_id = req.query.user_id;
        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        TransactionRecord.getAllRecordsByUserId(user_id, (err, records) => {
            if (err) {
                console.error('Error in /obtain_record/byUserId:', err);
                return res.status(500).json({ error: 'Failed to fetch records' });
            }
            if (records.length > 0) {
                res.json(records);
            } else {
                res.status(404).json({ error: 'No records found' });
            }
        });
    } catch (error) {
        console.error('Unhandled error in /obtain_record/byUserId:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
router.get('/obtain_records/pending_last', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getLastStatusRecord("= 'pending'", (err, record) => {
        if (err) {
            console.error('Error in /obtain_records/pending_last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(record);
    });
});
router.get('/obtain_records/processed_last', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getLastStatusRecord("<> 'pending'", (err, record) => {
        if (err) {
            console.error('Error in /obtain_records/processed_last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(record);
    });
});

router.get('/obtain_record/processed_all', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getAllRecordByStatus("!='pending'", (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/processed_all:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(records);
    });
});

router.get('/obtain_record/pending_all', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getAllRecordByStatus("= 'pending'", (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/pending_all:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(records);
    });
});

router.get('/obtain_record/:t_id', AuthMiddleware.verifyToken, (req, res) => {
    const t_id = req.params.t_id;
    TransactionRecord.getRecordById(t_id, (err, record) => {
        if (err) {
            console.error('Error in /record/:t_id:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    });
});



router.post('/add_record', AuthMiddleware.verifyToken, (req, res) => {
    const { app_id, loyalty_pid, user_id, member_id, member_first,member_last, transaction_date, ref_num, amount, additional_info } = req.body;
    
    const transactionData = {
        app_id,
        loyalty_pid,
        user_id,
        member_id,
        member_last,
        member_first,
        transaction_date,
        ref_num,
        amount,
        additional_info: JSON.stringify(additional_info)
    };

    if(!TransactionRecord.checkValidity(transactionData,(err)=>{
        return res.status(400).json(err);
    })){
        return ;
    }

    TransactionRecord.addTransaction(transactionData, (err, result) => {
        if (err) {
            console.error('Error in /add_record:', err);
            return res.status(500).json({ error: 'Failed to add transaction' });
        }
        return res.status(200).json(result);
    });
});

router.delete('/remove_record_by_tid/:t_id', AuthMiddleware.verifyToken, (req, res) => {
    const t_id = req.params.t_id;
    TransactionRecord.removeTransaction(t_id, (err, result) => {
        if (err) {
            console.error('Error in /remove_record/:t_id:', err);
            return res.status(500).json({ error: 'Failed to remove transaction' });
        }
        res.json(result);
    });
});

router.delete('/remove_record_by_ref_num/:ref_num', AuthMiddleware.verifyToken, (req, res) => {
    const ref_num = req.params.ref_num;
    TransactionRecord.removeTransactionByRefNum(ref_num, (err, result) => {
        if (err) {
            console.error('Error in /remove_record/:ref_num:', err);
            return res.status(500).json({ error: 'Failed to remove transaction' });
        }
        res.json(result);
    });
});

router.put('/updateTransactionStatus', AuthMiddleware.verifyToken, (req, res) => {
    const { t_id, status } = req.body;
    TransactionRecord.updateTransactionStatus(t_id, status, (err, result) => {
        if (err) {
            console.error('Error in /updateTransactionStatus:', err);
            return res.status(500).json({ error: 'Failed to update transaction status' });
        }
        res.json(result);
    });
});
router.post('/batchUpdateTransactionStatus', AuthMiddleware.verifyToken, (req, res) => {
    const { t_ids, status } = req.body;
    TransactionRecord.batchUpdateTransactionStatus(t_ids, status, (err, result) => {
        if (err) {
            console.error('Error in /updateTransactionsStatus:', err);
            return res.status(500).json({ error: 'Failed to update transaction statuses' });
        }
        res.json(result);
    });
});
router.get('/obtain_record/By_member_id/all', AuthMiddleware.verifyToken, (req, res) => {
    const member_id = req.query.member_id;
    TransactionRecord.getAllRecordsByMemberId(member_id, (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/By_member_id/all:', err);
            return res.status(500).json({ error: 'Failed to fetch records' });
        }
        if (records) {
            res.json(records);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    });
});

router.get('/obtain_record/By_member_id/pending', AuthMiddleware.verifyToken, (req, res) => {
    const member_id = req.query.member_id;
    TransactionRecord.getRecordsByMemberIdAndStatus(member_id, 'pending', (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/By_member_id/pending:', err);
            return res.status(500).json({ error: 'Failed to fetch records' });
        }
        if (records) {
            res.json(records);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    });
});

router.get('/obtain_record/By_member_id/processed', AuthMiddleware.verifyToken, (req, res) => {
    const member_id = req.query.member_id;
    TransactionRecord.getRecordsByMemberIdAndStatus(member_id, 'processed', (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/By_member_id/processed:', err);
            return res.status(500).json({ error: 'Failed to fetch records' });
        }
        if (records) {
            res.json(records);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    });
});
router.get('/obtain_record/by_ref_num/:ref_num', AuthMiddleware.verifyToken, (req, res) => {
    var ref_num = req.params.ref_num;
    if (!ref_num) {
        return res.status(400).json({ error: 'reference number is required' });
    }
    TransactionRecord.getRecordByReferenceNumber(ref_num, (err, record) => {
        if (err) {
            console.error('Error in /obtain_record/By_ref_num:', err);
            return res.status(500).json({ error: 'Failed to fetch record' });
        }
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    });
});

router.post('/gen_acc',(req,res)=>{
    submit_accrual_job().then(()=>{
        console.log("DONE ACC");
    });
    return res.status(200).json({success:1});
});

router.post('/gen_hbf',(req,res)=>{
    get_handback_job().then(()=>{
        console.log("DONE HBF");
    });
    return res.status(200).json({success:2});
})

module.exports = router;
