const express = require('express');
const AuthMiddleware = require('../middleware/authMiddleware');
const { TransactionRecord } = require('../models/transactions.js');
const router = express.Router();

router.get('/obtain_records/pending_last', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getLastStatusRecord('pending', (err, record) => {
        if (err) {
            console.error('Error in /obtain_records/pending_last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(record);
    });
});

router.get('/obtain_records/processed_last', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getLastStatusRecord('processed', (err, record) => {
        if (err) {
            console.error('Error in /obtain_records/processed_last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(record);
    });
});

router.get('/obtain_record/processed_all', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getAllRecordByStatus('processed', (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/processed_all:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(records);
    });
});

router.get('/obtain_record/pending_all', AuthMiddleware.verifyToken, (req, res) => {
    TransactionRecord.getAllRecordByStatus('pending', (err, records) => {
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
    const { app_id, loyalty_pid, user_id, member_id, member_name, transaction_date, amount, additional_info } = req.body;
    if (!/^\d{8}$/.test(transaction_date)) {
        return res.status(400).json({ error: 'Invalid transaction_date format. It should be DDMMYYYY.' });
    }

    if (isNaN(member_id)) {
        return res.status(400).json({ error: 'Invalid member_id. It should be a number.' });
    }
    if (isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid amount. It should be a number.' });
    }
    const transactionData = {
        app_id,
        loyalty_pid,
        user_id,
        member_id,
        member_name,
        transaction_date,
        amount,
        additional_info: JSON.stringify(additional_info)
    };
    TransactionRecord.addTransaction(transactionData, (err, result) => {
        if (err) {
            console.error('Error in /add_record:', err);
            return res.status(500).json({ error: 'Failed to add transaction' });
        }
        res.json(result);
    });
});

router.delete('/remove_record/:t_id', AuthMiddleware.verifyToken, (req, res) => {
    const t_id = req.params.t_id;
    TransactionRecord.removeTransaction(t_id, (err, result) => {
        if (err) {
            console.error('Error in /remove_record/:t_id:', err);
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
        res.json(records);
    });
});

router.get('/obtain_record/By_member_id/pending', AuthMiddleware.verifyToken, (req, res) => {
    const member_id = req.query.member_id;
    TransactionRecord.getRecordsByMemberIdAndStatus(member_id, 'pending', (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/By_member_id/pending:', err);
            return res.status(500).json({ error: 'Failed to fetch records' });
        }
        res.json(records);
    });
});

router.get('/obtain_record/By_member_id/processed', AuthMiddleware.verifyToken, (req, res) => {
    const member_id = req.query.member_id;
    TransactionRecord.getRecordsByMemberIdAndStatus(member_id, 'complete', (err, records) => {
        if (err) {
            console.error('Error in /obtain_record/By_member_id/processed:', err);
            return res.status(500).json({ error: 'Failed to fetch records' });
        }
        res.json(records);
    });
});


module.exports = router;
