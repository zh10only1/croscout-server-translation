// routes/bookingRoutes.ts
import express from 'express';
import { createBooking, deleteBooking, getAllBookings, getBookingById, getBookingsByRole, manageBookings, submitTransactionId, updatePaymentDetails } from '../controllers/booking.controller';
import { checkSecureUser } from '../middleware/authentication';


const router = express.Router()

router

    //* Create a Booking
    /**
     * @route POST /api/bookings
     * @description Creates a new booking for a property.
     * @access Private
     *  
     * @params guestId, totalGuests, ownerId, propertyId, price, startDate, endDate
     *  
     * @returns {object} - Status and message
     *  
     * @throws {400} If the property is already booked for the selected dates
     * @throws {404} If the property not found
     */
    .post('/', checkSecureUser, createBooking)

    // Get all bookings
    /**
     * @route GET /api/bookings
     * @description Retrieves all bookings.
     * @access Private
     *  
     * @returns {object} - Status and an array of bookings
     */
    .get('/', getAllBookings)

    // Get booking by bookingId
    /**
    * @route GET /api/bookings/:bookingId
    * @description Retrieves a booking by its ID.
    * @access Private
    *  
    * @params bookingId
    *  
    * @returns {object} - Status and the booking details
    *  
    * @throws {404} If the booking not found
    */
    .get('/:bookingId', getBookingById)

    // Get bookings based on role
    /**
    * @route GET /api/bookings/user/:userId
    * @description Retrieves all bookings for a user based on their role.
    * @access Private
    *  
    * @params userId
    *  
    * @returns {object} - Status and an array of bookings
    *  
    * @throws {404} If the user not found or no bookings found
    */
    .get('/user/:userId', getBookingsByRole)


    // Update Booking Informations by bookingId
    /**
    * @route PUT /api/bookings/:bookingId
    * @description Updates booking information by booking ID.
    * @access Private
    *  
    * @params bookingId
    *  
    * @returns {object} - Status and message
    *  
    * @throws {400} If the action is invalid
    * @throws {404} If the booking not found
    */
    .put('/:bookingId', manageBookings)

    // Update Booking Informations by bookingId
    /**
    * @route DELETE /api/bookings/:bookingId
    * @description Deletes a booking by its ID.
    * @access Private
    *  
    * @params bookingId
    *  
    * @returns {object} - Status and message
    *  
    * @throws {404} If the booking not found
    */
    .delete('/:bookingId', deleteBooking)

    // Update payment details for a booking.
    /**
    * @route PUT /api/bookings/:bookingId/payment-details
    * @description Updates payment details for a booking.
    * @access Private
    *  
    * @params bookingId, agentPaypalEmail, paymentInstruction
    *  
    * @returns {object} - Status and message
    *  
    * @throws {400} If payment details already exist
    * @throws {404} If the booking not found
    */
    .put('/:bookingId/payment-details', updatePaymentDetails)

    // Submit the transaction ID for a booking.
    /**
    * @route POST /api/bookings/:bookingId/transaction-id
    * @description Submits the transaction ID for a booking.
    * @access Private
    *  
    * @params bookingId, userTransactionId
    *  
    * @returns {object} - Status and message
    *  
    * @throws {400} If the transaction ID already exists
    * @throws {404} If the booking not found
    */
    .post('/:bookingId/transaction-id', submitTransactionId)

module.exports = router;