import { NextFunction, Request, Response } from 'express';
import Transaction from '../models/transaction.model';
import User from '../models/user.model';

// Get All Transactions
// This function retrieves all transactions from the database.
export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Retrieve all transactions from the database
        const transactions = await Transaction.find();

        // Respond with the retrieved transactions
        res.json({ success: true, transactions });
    } catch (error) {
        // Log the error and pass it to the next middleware for error handling
        console.log(error);
        next(error);
    }
};

// Get Transactions By Role
// This function retrieves transactions for a user or agent based on their role.
export const getTransactionsByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const { userId } = req.params;

        // Find the user by ID
        const user = await User.findById(userId);

        // If the user is not found, send a response with a status of   404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Check the user's role and retrieve the appropriate transactions
        if (user?.role === 'user') {
            // Retrieve transactions for the user
            const transactions = await Transaction.find({ user: userId });

            // If transactions are found, respond with them
            if (transactions.length > 0) {
                res.status(200).json({ success: true, transactions });
            } else {

                // If no transactions are found, respond with a  404 error
                res.status(404).json({ success: false, error: 'No transactions found.' });
            }
        } else if (user?.role === 'agent') {
            // Retrieve transactions for the agent
            const transactions = await Transaction.find({ agent: userId });

            // If transactions are found, respond with them
            if (transactions.length > 0) {
                res.status(200).json({ success: true, transactions });
            } else {

                // If no transactions are found, respond with a  404 error
                res.status(404).json({ success: false, error: 'No transactions found.' });
            }
        } else {
            // If the user's role is neither 'user' nor 'agent', respond with a  404 error
            res.status(404).json({ success: false, error: 'No transactions found.' });
        }
    } catch (error) {
        // Log the error and pass it to the next middleware for error handling
        console.log(error);
        next(error);
    }
};