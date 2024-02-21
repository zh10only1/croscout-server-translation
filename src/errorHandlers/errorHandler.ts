import { Request, Response, NextFunction } from 'express';
import { MongooseError } from 'mongoose';

// Define the error handler middleware
const errorHandler = (err: MongooseError, req: Request, res: Response, next: NextFunction) => {
    // Check if the error is a validation error
    if (err.name === 'ValidationError') {
        // Respond with a  400 status and the error message
        return res.status(400).json({ success: false, error: err.message });
    }

    // Check if the error is a cast error
    else if (err.name === 'CastError') {
        // Respond with a  400 status and the error message
        return res.status(400).json({ success: false, error: err.message });
    }
    // For all other errors, respond with a  500 status and a generic error message
    res.status(500).json({
        success: false,
        error: 'Internal server error!'
    });
};

export default errorHandler;