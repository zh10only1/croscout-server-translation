const express = require('express');
import { getAllTransactions, getTransactionsByRole } from '../controllers/transaction.controller';
import { checkSecureUser } from '../middleware/authentication';

const router = express.Router();

router

    // Get all transactions
    /**
    * @route GET /api/transactions
    * @description Retrieves all transactions.
    * @access Private
    *   
    * @returns {object} - Status and an array of transactions
    */
    .get('/', checkSecureUser, getAllTransactions)

    // Get transaction based on user role with userId parameter
    /**
    * @route GET /api/transactions/:userId
    * @description Retrieves transactions based on user role with userId parameter.
    * @access Private
    *   
    * @params userId
    *   
    * @returns {object} - Status and an array of transactions
    *   
    * @throws {404} If no transactions found or user not found
    */
    .get('/:userId', checkSecureUser, getTransactionsByRole)


module.exports = router;
