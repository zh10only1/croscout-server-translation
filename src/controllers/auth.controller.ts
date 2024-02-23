import { Request, Response, NextFunction } from 'express';
import User, { UserDocument } from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { transporter } from '../utility/mailer';
import passport from 'passport';


dotenv.config();
const saltRounds = 10;

//* User Registration Controller  
//* User Registration Controller   
// Define the registerUser function
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure the request body to get user details
        const { email, password, name, role, taxNumber } = req.body;

        // Check if a user with the provided email already exists
        const userExist = await User.findOne({ email });
        // If the user exists, return an error response
        if (userExist) {
            return res.status(409).json({
                success: false,
                error: 'Email already exist. Please use a different email or log in'
            });
        }

        // Hash the user's password using bcrypt
        bcrypt.hash(password, saltRounds, async (err: Error | null, hash: string) => {
            try {
                // If the user wants to be an agent but did not provide a taxNumber, return an error
                if (role === 'agent' && !taxNumber) {
                    return res.status(400).json({
                        success: false,
                        error: 'Tax number is required for agents.'
                    });
                }

                // Create a new User document with the hashed password and other details
                const newUser = new User({
                    name,
                    email,
                    password: hash,
                    role,
                    ...(role === 'agent' ? { taxNumber } : {}), // Conditionally add taxNumber if role is 'agent'
                });

                // Save the new user to the database
                await newUser.save();

                // Return a success response indicating the user was registered
                return res.status(201).json({
                    success: true,
                    message: 'User registered successfully.'
                });
            } catch (error) {
                // If there's an error, pass it to the next middleware
                next(error);
            }
        });
    } catch (error) {
        // If there's an error, pass it to the next middleware
        next(error);
    }
};

//* User Login Controller   
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract email and password from the request body
        const { email, password } = req.body;

        // Validate that 'email' field is present in the request body
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Find the user by email in the database
        const user = await User.findOne({ email });

        // If the user is not found, return an error response
        if (!user) {
            return res.status(404).send({ success: false, error: 'User not found' });
        }
        // Create a payload with user information for JWT token
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        // If the user has a password (local account), compare the provided password with the stored hashed password
        if (user.password) {
            bcrypt.compare(password, user.password, (err: Error | null, result: boolean) => {
                if (result) {
                    // If the password matches, generate a JWT token
                    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: '1d' });

                    // Send a success response with the token and user information
                    res.status(200).send({
                        success: true,
                        message: "Login in successfully",
                        token: `Bearer ${token}`,
                        user
                    });
                } else {
                    // If the password does not match, return an error response
                    res.status(401).send({ success: false, error: 'Wrong password' });
                }
            });
        } else {
            // If the user does not have a password (Google account), they are already authenticated
            // Generate a JWT token
            const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: '1d' });

            // Send a success response with the token and user information
            res.status(200).send({
                success: true,
                message: "Login in successfully",
                token: `Bearer ${token}`,
                user
            });
        }
    } catch (error) {
        // If there's an error, pass it to the next middleware
        next(error);
    }
};

//* User Logout
export const logOutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Call the logout method provided by Passport
        req.logout((err: Error | null) => {
            if (err) {
                // If there's an error during logout, pass it to the next middleware
                return next(err);
            }

            // Send a response indicating the user has logged out
            res.send({ isLogout: true });
        });
    } catch (error) {
        // If there's an error, pass it to the next middleware
        next(error);
    }
};


//* Forgot Password Controller
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract email and client URL from the request body
        const { email, clientUrl } = req.body;

        // Find the user by email in the database
        const user: UserDocument | null = await User.findOne({ email });

        // If the user is not found, return an error response
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Ensure the JWT secret key is set
        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) {
            throw new Error('JWT_SECRET_KEY is not set');
        }

        // Generate a reset token that expires in  1 hour
        const resetToken = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1h' });

        // Set the reset token and expiration on the user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); //  1 hour from now
        await user.save();

        // Ensure the Gmail user is set
        const gmailUser = process.env.GMAIL_USER;
        if (!gmailUser) {
            throw new Error('GMAIL_USER is not set');
        }

        // Define the email options
        const mailOptions = {
            from: {
                name: "Croscout",
                address: gmailUser
            },
            to: user.email,
            subject: 'Password Reset',
            html: `You are receiving this because you have requested the reset of the password for your account.<br/>
            Please click on the following link, or paste this into your browser to complete the process:<br/>
            <a href="${clientUrl}/reset-password/${resetToken}">Click here to reset your password</a><br/>
            If you did not request this, please ignore this email and your password will remain unchanged.`,
        };

        // Send the password reset email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, error: 'Failed to send reset email' });
            }
            res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
        });
    } catch (error) {
        console.log("Error in forgotPassword: ", error);
        next(error);
    }
};

//* Reset Password Controller
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the token and new password from the request body
        const { token, newPassword } = req.body;

        // Ensure the JWT secret key is set
        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) {
            throw new Error('JWT_SECRET_KEY is not set');
        }

        // Verify the token and get the user ID
        const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;
        const userId = decoded.id;

        // Find the user by ID
        const user = await User.findById(userId);

        // If the user is not found, return an error response
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if the reset token is valid
        if (token !== user.resetPasswordToken) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token. Resend again' });
        }

        // Check if the token has expired
        if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
            return res.status(400).json({ success: false, error: 'Token has expired. Resend again' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);


        // Update the user's password and clear the reset token and expiration
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send a success response
        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Error in resetPassword: ', error);
        next(error)
    }
};


// Initiate Google authentication
export const authGoogle = passport.authenticate('google', {
    scope: ['profile', 'email'],
});

// Handle Google authentication callback with a custom callback
export const authGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', (err: any, user: UserDocument, info: any) => {
        if (err) {
            console.error('Error during Google authentication:', err); // Log the error for debugging
            return next(err);
        }
        if (!user) {
            // Send a JSON response with an error message
            return res.status(401).json({ success: false, error: 'Authentication failed. Please try again.' });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Error during login:', err); // Log the error for debugging
                return next(err);
            }
            // Check some condition to decide where to redirect the user
            if (user.isAdmin) {
                // Send a JSON response with a success message and a URL to redirect to the admin dashboard
                return res.redirect(`${process.env.CLIENT_URL}/dashboard`)
            } else {
                return res.redirect(`${process.env.CLIENT_URL}/dashboard/user/my-bookings`)
            }
        });
    })(req, res, next);
};