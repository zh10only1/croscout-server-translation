import passport from 'passport';
import { Strategy as JwtStrategy, StrategyOptions, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import User from '../models/user.model';

// Load environment variables
dotenv.config();

// Define options for the JWT strategy
const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from the Authorization header
    secretOrKey: process.env.JWT_SECRET_KEY || '', // Use the JWT secret key from environment variables
};

// Configure the JWT strategy for Passport
passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            // Find the user by the ID in the JWT payload
            const user = await User.findOne({ _id: jwt_payload.id });

            // If the user is found, call the done callback with the user object
            if (user) {
                return done(null, user);
            } else {
                // If the user is not found, call the done callback with false
                return done(null, false);
            }
        } catch (err) {
            // If there's an error, call the done callback with the error
            return done(err, false);
        }
    })
);

// Serialize user to store the user ID in the session
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Deserialize user to retrieve the user object from the session
passport.deserializeUser((id: any, done) => {
    User.findById(id, (err: any, user: any) => {
        done(err, user);
    });
});

export default passport;