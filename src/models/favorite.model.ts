import mongoose, { Schema, Document } from 'mongoose';

interface IFavoriteList extends Document {
    user: mongoose.Types.ObjectId;
    properties: mongoose.Types.ObjectId[];
}

const FavoriteListSchema: Schema = new Schema({
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    properties: [{ type: mongoose.Types.ObjectId, ref: 'Property' }]
});

const FavoriteList = mongoose.model<IFavoriteList>('FavoriteList', FavoriteListSchema);
export default FavoriteList;