import { Request, Response, NextFunction } from 'express';
import Booking, { IBooking } from '../models/booking.model';
import User, { UserDocument } from '../models/user.model';
import Property, { IProperty } from '../models/property.model';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import { transporter } from '../utility/mailer';

// Define the Owner interface
interface IOwner {
    _bookingId: mongoose.Types.ObjectId;
    email: string;
    name: string;
}

interface IGuest {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
}


//* Create Booking for a Property
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure the request body to get booking details
        const { guestId, totalGuests, ownerId, propertyId, price, startDate, endDate } = req.body;

        // Find the property and cast the owner to the IOwner interface
        const property = await Property.findById(propertyId)
            .populate('owner') as IProperty & { owner: IOwner };

        // If the property is not found, return an error response
        if (!property) {
            return res.status(404).json({ message: 'Property not found.' });
        }

        // Check if the property is already booked for the same dates
        const existingBooking = await Booking.findOne({
            property: propertyId,
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                },
                {
                    startDate: { $gte: startDate, $lte: endDate }
                }
            ]
        });

        // If the property is already booked, return an error response
        if (existingBooking) {
            return res.status(400).json({ success: false, error: 'Property already booked for the selected dates.' });
        }

        // Create a new booking
        const booking = new Booking({
            guest: guestId,
            owner: ownerId,
            price,
            totalGuests,
            property: propertyId,
            startDate,
            endDate,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save the new booking to the database
        await booking.save();

        // Update the bookedDates array with the new booking range
        property.bookedDates.push({ startDate, endDate });

        // Save the updated property
        await property.save();

        // Ensure the Gmail user is set
        const gmailUser = process.env.GMAIL_USER;
        if (!gmailUser) {
            throw new Error('GMAIL_USER is not set');
        }

        // If the property has an owner, send a confirmation email
        if (property && property.owner) {
            const mailOptions = {
                from: {
                    name: "Croscout",
                    address: gmailUser
                },
                to: property.owner.email, // Assuming the owner has an email field
                subject: 'New Booking Confirmation',
                text: `Hello ${property.owner.name}, a new booking has been made for your property.`,
                html: `<b>Hello ${property.owner.name},</b><br><p>A new booking has been made for your property.</p>`
            };

            // Send the confirmation email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log(`Email sent: ${info.response}`);
                }
            });
        }

        // Return a success response with the created booking
        res.status(201).json({ success: true, message: 'Booking successfully created', booking });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

//* Manage the booking
export const manageBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract bookingId and action from the request
        const { bookingId } = req.params;
        const { action } = req.body;

        // Find the booking by ID
        const booking = await Booking.findById(bookingId).populate('guest').populate('owner') as IBooking & { guest: IGuest, owner: IOwner };

        // If the booking is not found, return an error response
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        // Find booking property by property id
        const properties = await Property.findById(booking.property);


        let message = '';
        // Handle the 'confirm' action
        if (action === 'confirm') {
            if (booking.status === 'confirmed') {
                return res.json({ success: false, error: "Already confirmed this booking" })
            }
            booking.status = 'confirmed';
            message = 'Your booking has been confirmed.';


            // Create a new transaction when the booking is confirmed
            const transaction = new Transaction({
                booking: booking._id,
                user: booking.guest._id,
                agent: booking.owner,
                amount: parseFloat(booking.price),
                transactionId: booking.userTransactionId,
                paymentMethod: 'Paypal',
            });

            // Check if the necessary payment details are provided
            if (!booking.agentPaypalEmail) {
                return res.json({ success: false, error: "You haven't sent a Payment Request with Payment Details to the user. Please send the payment request before updating the status." });
            }
            if (!booking.userTransactionId) {
                return res.json({ success: false, error: "Transaction ID has not been received yet. Please wait until the Transaction ID is received before updating the status." });
            }
            // Save the transaction to the database
            await transaction.save();

        } else if (action === 'cancel') {
            // Handle the 'cancel' action
            if (booking.status === 'confirmed') {
                return res.json({ success: false, error: "This booking has already been confirmed. Cancellation is not allowed at this stage." })
            }
            if (properties?.bookedDates) {
                properties.bookedDates = properties.bookedDates.filter(date =>
                    !(date.startDate.getTime() === booking.startDate.getTime() && date.endDate.getTime() === booking.endDate.getTime())
                );
            }
            booking.status = 'cancelled';
            message = 'Your booking has been cancelled.';
        } else {
            // If the action is invalid, return an error response
            return res.status(400).json({ success: false, error: 'Invalid action.' });
        }

        // Save the updated booking and property
        await booking.save({ validateBeforeSave: false });
        await properties?.save();

        // Ensure the Gmail user is set
        const gmailUser = process.env.GMAIL_USER;
        if (!gmailUser) {
            throw new Error('GMAIL_USER is not set');
        }

        // Send email to the guest
        if (booking.guest) {
            const mailOptions = {
                from: {
                    name: "Croscout",
                    address: gmailUser
                },
                to: [booking.guest.email, booking.owner.email], // Assuming the guest has an email field
                subject: `Booking Status Update: ${booking.status}`,
                text: `Hello ${booking.guest.name}, your booking has been ${booking.status}.`,
                html: `<b>Hello there,</b><br><p>The booking has been ${booking.status}. Booking id: ${booking.id}</p>`
            };

            // Send the status update email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log(`Email sent: ${info.response}`);
                }
            });
        }

        // If the booking is cancelled, delete it from the database
        if (booking.status === 'cancelled') {
            await Booking.deleteOne({ _id: booking._id });
        }
        // Return a success response with the message
        return res.json({ success: true, message });

    } catch (error) {
        console.error(error);
        next(error);
    }
};



// Get All Bookings
// This function retrieves all bookings from the database.
export const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Find all bookings and populate the 'guest' and 'owner' fields with only the 'name' field
        const bookings: IBooking[] = await Booking.find().populate('guest', 'name -_id').populate('owner', 'name -_id');

        // Send a response with a status of  200 and a JSON object containing a success flag and the array of bookings
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};


// Get booking by bookingId
// This function retrieves a booking by its ID from the database.
export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the bookingId from the request parameters
        const { bookingId } = req.params;
        // Find the booking by ID and populate the 'guest', 'property', and 'owner' fields with specific fields

        const booking: IBooking | null = await Booking.findById(bookingId)
            .populate('guest', '-password')
            .populate('property', '-bookedDates')
            .populate('owner', '-password');

        // If the booking is not found, send a response with a status of  404 and an error message
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        // Send a response with a status of  200 and a JSON object containing a success flag and the booking details
        res.status(200).json({ success: true, booking });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};

// Get bookings by user role
// This function retrieves bookings based on the user's role.
export const getBookingsByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the userId from the route parameter
        const userId = req.params.userId;

        // Find the user by the provided userId
        const user: UserDocument | null = await User.findById(userId).exec();

        // If the user is not found, send a response with a status of   404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Initialize an empty array to hold the bookings
        let bookings: IBooking[] = [];

        // Check the user's role and retrieve bookings accordingly
        if (user.role === 'user') {
            // If the user is a guest, retrieve their bookings
            bookings = await Booking.find({ guest: userId })
                .populate('guest', 'name -_id');
        } else if (user.role === 'agent') {
            // If the user is an agent, retrieve all bookings for their properties
            bookings = await Booking.find({ owner: userId })
                .populate('guest', 'name -_id');
        }

        // Check if bookings array is empty and send an appropriate response
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, error: 'No bookings found' });
        }

        // Send a response with a status of   200 and a JSON object containing a success flag and the array of bookings
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};

// Delete booking by bookingId
// This function deletes a booking by its ID from the database.
export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the bookingId from the request parameters
        const { bookingId } = req.params;

        // Find the booking by ID and delete it
        const result = await Booking.findByIdAndDelete(bookingId).exec();

        // If the booking is not found, send a response with a status of   404 and an error message
        if (!result) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        // Send a response with a status of   200 and a JSON object containing a success flag and a message indicating the booking was deleted successfully
        res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};


// Update Payment Details
// This function updates the payment details for a booking by its ID.
export const updatePaymentDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the bookingId from the request parameters
        const { bookingId } = req.params;

        // Extract the agentPaypalEmail and paymentInstruction from the request body
        const { agentPaypalEmail, paymentInstruction } = req.body;

        // Find the booking by ID
        const booking = await Booking.findById(bookingId).populate('guest') as IBooking & { guest: IGuest };

        // If the booking is not found, send a response with a status of   404 and an error message
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        // Check if agentPaypalEmail or paymentInstruction already exist
        if (booking.agentPaypalEmail || booking.paymentInstruction) {
            return res.status(400).json({ success: false, error: 'Payment details already exist.' });
        }

        // Update the booking with new payment details
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
            agentPaypalEmail,
            paymentInstruction,
        }, { new: true });

        // TODO: Send email notification to user with payment details
        // Send email notification to user with payment details
        // Ensure the Gmail user is set
        const gmailUser = process.env.GMAIL_USER;
        if (!gmailUser) {
            throw new Error('GMAIL_USER is not set');
        }

        const mailOptions = {
            from: {
                name: "Croscout",
                address: gmailUser // Assuming you have the Gmail user set in your environment variables
            },
            to: booking.guest.email, // Assuming the guest has an email field
            subject: 'Requested to Booking Payment with Details',
            text: `Dear ${booking.guest.name},\n\nWe are pleased to inform you that your booking payment details have been updated. Here are the new details for booking ID: ${bookingId}:\n\nAgent PayPal Email: ${agentPaypalEmail}\nPayment Instruction: ${paymentInstruction}\n\nPlease ensure you have completed the payment process as instructed. If you have any questions or need further assistance, feel free to contact us.\n\nThank you for choosing Croscout.\n\nBest regards,\nThe Croscout Team`,
            html: `<p>Dear ${booking.guest.name},</p><br><p>We are pleased to inform you that your booking payment details have been updated. Here are the new details for booking ID: <strong>${bookingId}</strong>:</p>
                   <p><strong>Agent PayPal Email:</strong> ${agentPaypalEmail}</p>
                   <p><strong>Payment Instruction:</strong> ${paymentInstruction}</p>
                   <p>Please ensure you have completed the payment process as instructed. If you have any questions or need further assistance, feel free to contact us.</p>
                   <p>Thank you for choosing Croscout.</p>
                   <p>Best regards,<br>The Croscout Team</p>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, error: 'Failed to send payment details email' });
            }
            console.log(`Email sent: ${info.response}`);
        });

        // Send a response with a status of   200 and a JSON object containing a success flag, a message, and the updated booking
        res.json({ success: true, message: 'Payment details updated', booking: updatedBooking });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};

// Submit Transaction ID
// This function updates the transaction ID for a booking by its ID.
export const submitTransactionId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the bookingId from the request parameters
        const { bookingId } = req.params;

        // Extract the userTransactionId from the request body
        const { userTransactionId } = req.body;

        // Find the booking by ID
        const booking = await Booking.findById(bookingId).populate('owner') as IBooking & { owner: IOwner };

        // If the booking is not found, send a response with a status of   404 and an error message
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        // Check if userTransactionId already exists
        if (booking.userTransactionId) {
            return res.status(400).json({ success: false, error: 'Transaction ID already exists.' });
        }

        // Update the booking with the new transaction ID
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
            userTransactionId,
        }, { new: true });

        // TODO: Send email notification to agent with transaction ID
        const gmailUser = process.env.GMAIL_USER;
        if (!gmailUser) {
            throw new Error('GMAIL_USER is not set');
        }

        const mailOptions = {
            from: {
                name: "Croscout",
                address: gmailUser// Assuming you have the Gmail user set in your environment variables
            },
            to: booking.owner.email, // Assuming the owner has an email field
            subject: 'Transaction ID Submitted',
            text: `Hello ${booking.owner.name},\n\nThe transaction ID for booking ID: ${bookingId} has been submitted. Here is the transaction ID: ${userTransactionId}\n\nPlease verify the transaction and update the booking status accordingly.\n\nThank you for your attention to detail.`,
            html: `<p>Hello ${booking.owner.name},</p><br><p>The transaction ID for booking ID: <strong>${bookingId}</strong> has been submitted. Here is the transaction ID: <strong>${userTransactionId}</strong>.</p>
                   <p>Please verify the transaction and update the booking status accordingly.</p>
                   <p>Thank you for your attention to detail.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, error: 'Failed to send transaction ID email' });
            }
            console.log(`Email sent: ${info.response}`);
        });

        // Send a response with a status of   200 and a JSON object containing a success flag, a message, and the updated booking
        res.json({ success: true, message: "Transaction ID updated successfully", booking: updatedBooking });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};