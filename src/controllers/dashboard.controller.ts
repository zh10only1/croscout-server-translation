import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import Property from '../models/property.model';
import Transaction from '../models/transaction.model';
import Booking from '../models/booking.model';
import mongoose from 'mongoose';

// Get Dashboard Stats
// This function retrieves various statistics for the dashboard based on the user's role.
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const userId = req.params.userId;
        // Find the user by the provided userId

        const user = await User.findById(userId);

        // If the user is not found, send a response with a status of  404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // If the user is a 'user', return an error response as only admins and agents can access this endpoint
        if (user.role === 'user') {
            return res.status(403).json({ success: false, error: 'Only admins and agents can access this endpoint.' });
        }

        let stats = {};

        // If the user is an 'admin', retrieve the following statistics:
        if (user.role === 'admin') {
            // Estimated User Count
            const userCount = await User.countDocuments();
            // Total Property Length
            const propertyCount = await Property.countDocuments();
            // Total Revenue
            const totalRevenue = await Transaction.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            // Latest  4 Bookings
            const latestBookings = await Booking.find().sort({ createdAt: -1 }).limit(4)
                .populate('guest', 'name -_id').populate('owner', 'name -_id');

            // Assign the statistics to the stats object
            stats = {
                userCount,
                propertyCount,
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                latestBookings
            };
        } else if (user.role === 'agent') {
            // Total Properties of Agent
            const agentProperties = await Property.countDocuments({ owner: userId });

            // Total Revenue of Agent
            const agentRevenue = await Transaction.aggregate([
                { $match: { agent: new mongoose.Types.ObjectId(userId) } }, // Ensure the agent field is an ObjectId
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            // Total Bookings of Agent
            const agentBookings = await Booking.countDocuments({ owner: userId });
            // Latest  4 Bookings of Agent
            const latestAgentBookings = await Booking.find({ owner: userId }).sort({ createdAt: -1 }).limit(4).populate('guest', 'name -_id');

            // Assign the statistics to the stats object
            stats = {
                agentProperties,
                agentRevenue: agentRevenue.length > 0 ? agentRevenue[0].total : 0,
                agentBookings,
                latestAgentBookings
            };
        }

        // Send a response with a status of  200 and a JSON object containing a success flag and the statistics
        res.status(200).json({ success: true, stats });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};