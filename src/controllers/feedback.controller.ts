import { Request, Response, NextFunction } from 'express';
import Feedback, { IFeedback } from '../models/feedback.model';
import Property from '../models/property.model';
import User, { UserDocument } from '../models/user.model';
import Booking from '../models/booking.model';
import { translateText } from '../utility/translation';

export interface Feedback {
    _id: string;
    property: string;
    user: string | null;
    rating: number;
    comment: string;
    __v: number;
    createdAt: string;
    updatedAt: string;
}

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

export const translateFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { feedbacks, lng }: { feedbacks: Feedback[], lng: string } = req.body;

        if (!feedbacks || !Array.isArray(feedbacks)) return res.status(400).json({ success: false, error: 'Invalid feedbacks format' });
        if (!lng) return res.status(400).json({ success: false, error: 'Language parameter is required' });

        let translatedFeedbacks: Feedback[] = [];

        // hr == Croatian language
        if (lng === 'hr') {
            //Handling croatian translation using OpenAI
            // translatedFeedbacks = await Promise.all(feedbacks.map((property) => translatePropertyCroatian(property)));
        }
        else {
            // Handling other languages using LibreTranslate
            translatedFeedbacks = await Promise.all(feedbacks.map((feedback) => translateFeedback(feedback, lng)));
        }

        res.status(200).json({ success: true, translatedFeedbacks });
    } catch (error) {
        res.status(500).json({ success: false, error: `Failed to translate feedbacks ${error}` });
    }
};

const translateFeedback = async (feedback: Feedback, targetLang: string): Promise<Feedback> => {
    let translatedComment: string = '';

    try {
        translatedComment = await translateText(feedback.comment, targetLang);
    } catch (error) {
        console.error("Failed to translate comment of feedback", error);
        return feedback;
    }

    const translatedFeedback: Feedback = { ...feedback, comment: translatedComment };
    return translatedFeedback;
};