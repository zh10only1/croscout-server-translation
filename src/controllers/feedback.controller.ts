import { Request, Response, NextFunction } from 'express';
import Feedback, { IFeedback } from '../models/feedback.model';
import Property from '../models/property.model';
import User, { UserDocument } from '../models/user.model';
import Booking from '../models/booking.model';

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rating, comment, bookingId, propertyId } = req.body;
        const userId = (req.user as UserDocument)._id;

        const feedback: IFeedback = new Feedback({
            property: propertyId,
            user: userId,
            rating,
            comment
        });

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).send({ success: false, error: "Need to booking first, otherwise you can't provide a review  for this property." });
        }

        if (booking && booking.status !== 'confirmed') {
            return res.status(404).send({ success: false, error: "Your boking request is pending, Please wait until the booking is confirmed." });
        }



        await feedback.save();

        // Update the property with the new feedback
        await Property.updateOne({ _id: propertyId }, { $push: { feedbacks: feedback._id } });

        res.status(201).json({ success: true, message: 'Feedback created successfully', feedback });
    } catch (error) {
        next(error);
    }
};

export const getFeedbacksForProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { propertyId } = req.params;
        const feedbacks = await Feedback.find({ property: propertyId }).populate('user', 'name image -_id');

        if (feedbacks && feedbacks.length < 1) {
            return res.status(404).json({ success: false, error: 'Feedback not found' });
        }

        res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        next(error);
    }
};