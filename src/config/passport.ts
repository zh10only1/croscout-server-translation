import passport from 'passport';
import { Strategy as JwtStrategy, StrategyOptions, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import User from '../models/user.model';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';


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






// Configure the Google strategy for Passport
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID : (() => { throw new Error('GOOGLE_CLIENT_ID is not set'); })(),

            clientSecret: process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET : (() => { throw new Error('GOOGLE_CLIENT_ID is not set'); })(),

            callbackURL: process.env.NODE_ENV === 'production' ? process.env.GOOGLE_CALLBACK_URL : 'http://localhost:5000/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Find or create a user in your database using the Google profile information
                const existingUser = await User.findOne({ googleId: profile.id });

                if (existingUser) {
                    return done(null, existingUser);
                }

                const newUser = new User({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : undefined,
                    isEmailVerified: true,
                    image: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined
                    // Add any other fields you want to store from the Google profile
                });

                await newUser.save();
                return done(null, newUser);
            } catch (error) {
                return done(error as Error, false);
            }
        }
    )
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