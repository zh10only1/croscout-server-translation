import passport from 'passport';
import { RequestWithUser } from '../types';
import { Request, Response, NextFunction } from 'express';
import { UserDocument } from '../models/user.model';

// Middleware to check if the requested user is secure
const checkSecureUser = (req: Request, res: Response, next: NextFunction) => {
    // Use Passport's JWT strategy to authenticate the user
    passport.authenticate('jwt', { session: false }, (err: any, user: UserDocument | false, info: any) => {
        // If there's an error during authentication, pass it to the next middleware
        if (err) {
            return next(err);
        }
        // If the user is not authenticated, respond with a  401 Unauthorized status
        if (!user) {
            return res.status(401).json({ message: "Unauthorized Access" });
        }

        // If the user is authenticated, attach the user object to the request and proceed to the next middleware
        req.user = user;
        next();
    })(req, res, next);
};

export { checkSecureUser };