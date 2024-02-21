import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
    property: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema({
    property: { type: mongoose.Types.ObjectId, ref: 'Property', required: true },
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export default Feedback;