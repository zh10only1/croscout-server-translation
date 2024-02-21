import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';


const router = express.Router()

router

    //* Get dashboard stats
    /**
    * @route GET /api/dashboard/stats/:userId
    * @description Retrieves dashboard statistics for a user based on their role.
    * @access Private
    *   
    * @params userId
    *   
    * @returns {object} - Status and dashboard statistics
    *   
    * @throws {403} If the user is not an admin or agent
    * @throws {404} If the user not found
    */
    .get('/stats/:userId', getDashboardStats)



module.exports = router;