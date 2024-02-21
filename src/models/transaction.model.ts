import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    booking: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    agent: mongoose.Types.ObjectId;
    amount: number;
    transactionId: string;
    paymentMethod: string;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
    booking: { type: mongoose.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    agent: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, default: 'Paypal' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;