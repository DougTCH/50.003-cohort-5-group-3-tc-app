const express = require('express');
const AuthMiddleware = require('../middleware/authMiddleware');
const { TransactionRecord } = require('../models/transactions.js');
const router = express.Router();

router.get('/obtain_records/pending/:last', AuthMiddleware.verifyToken, (req, res) => {
    const last = req.params.last;
    TransactionRecord.getPendingRecords(last, (err, records) => {
        if (err) {
            console.error('Error in /obtain_records/pending/:last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(records);
    });
});

router.get('/obtain_records/processed/:last', AuthMiddleware.verifyToken, (req, res) => {
    const last = req.params.last;
    TransactionRecord.getCompleteRecords(last, (err, records) => {
        if (err) {
            console.error('Error in /obtain_records/processed/:last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(records);
    });
});

router.get('/obtain_records/status/:status/:last', AuthMiddleware.verifyToken, (req, res) => {
    const status = req.params.status;
    const last = req.params.last;
    TransactionRecord.getRecordsByStatus(status, last, (err, records) => {
        if (err) {
            console.error('Error in /obtain_records/status/:status/:last:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(records);
    });
});

router.get('/record/:t_id', AuthMiddleware.verifyToken, (req, res) => {
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
    const { app_id, loyalty_pid, user_id, member_id, member_name, transaction_date, reference_number, amount, additional_info } = req.body;
    const transactionData = {
        app_id,
        loyalty_pid,
        user_id,
        member_id,
        member_name,
        transaction_date,
        reference_number,
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

router.delete('/remove_record/:reference_number', AuthMiddleware.verifyToken, (req, res) => {
    const reference_number = req.params.reference_number;
    TransactionRecord.removeTransaction(reference_number, (err, result) => {
        if (err) {
            console.error('Error in /remove_record/:reference_number:', err);
            return res.status(500).json({ error: 'Failed to remove transaction' });
        }
        res.json(result);
    });
});

module.exports = router;
