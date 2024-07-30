import { Request, Response, NextFunction } from 'express';
import Feedback, { IFeedback } from '../models/feedback.model';
import Property from '../models/property.model';
import User, { UserDocument } from '../models/user.model';
import Booking from '../models/booking.model';
import { supportedLanguages } from '../utility/translation';
import OpenAI from "openai";
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

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

        translatedFeedbacks = await Promise.all(feedbacks.map((feedback) => translateFeedback(feedback, lng)));

        res.status(200).json({ success: true, translatedFeedbacks });
    } catch (error) {
        res.status(500).json({ success: false, error: `Failed to translate feedbacks ${error}` });
    }
};

const translateFeedback = async (feedback: Feedback, targetLang: string): Promise<Feedback> => {
    let translatedComment: string = '';

    let openai: OpenAI;
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
        });
    } catch (error) {
        console.error("Failed to initialize OpenAI API");
        return feedback;
    }

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [
            { role: 'system', content: `You are a helpful assistant that translates text into ${supportedLanguages[targetLang]} Language and returns the translated text.` },
            { role: 'user', content: `Translate the following text to ${supportedLanguages[targetLang]} Language:\n\n${feedback.comment}` },
        ],
        model: 'gpt-3.5-turbo',
    };

    let chatCompletion: OpenAI.Chat.ChatCompletion;
    try {
        chatCompletion = await openai.chat.completions.create(params);
    } catch (error) {
        console.error("Failed to translate Feedback with OpenAI API");
        return feedback;
    }

    try {
        translatedComment = chatCompletion.choices[0].message.content !== null ? chatCompletion.choices[0].message.content : "";
        console.log(translatedComment);
    } catch (error) {
        console.error("Failed to parses translated Feedback");
        return feedback;
    }

    const translatedFeedback: Feedback = translatedComment !== "" ? { ...feedback, comment: translatedComment } : feedback;
    return translatedFeedback;
};