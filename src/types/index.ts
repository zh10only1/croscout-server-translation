import { Request } from 'express';
import { UserDocument } from '../models/user.model';
// import mongoose from 'mongoose';

export interface RequestWithUser extends Request {
    user: {
        _id: string
    }
}