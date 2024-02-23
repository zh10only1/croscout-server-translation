import { Request, Response, NextFunction } from 'express';
import User, { UserDocument } from '../models/user.model';
import { RequestWithUser } from '../types';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
const saltRounds = 10;

interface ICommonProperties {
    image: string;
    name: string;
    taxNumber: string;
    role: string;
    isCompletedProfile: boolean;
    isAdmin: boolean;
    telephoneOrPhone: string;
    street: string;
    houseOrBuildingNum: string;
    postcode: string;
    city: string;
    state: string;
}

// Get Current User
// This function retrieves the current authenticated user's information.
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Passport.js attaches the user object to the request object after successful authentication
        if (req.user) {
            // Use the user ID from the session to find the user in the database
            User.findById((req.user as UserDocument)._id)
                .select('-password') // Exclude the password field
                .then(user => {
                    if (user) {
                        // Send the user object as a response
                        res.json({ success: true, user });
                    } else {
                        // If the user is not found, send an appropriate response
                        res.status(404).json({ success: false, error: 'User not found' });
                    }
                })
                .catch(err => {
                    // Handle any errors that occurred during the request
                    next(err);
                });
        } else {
            // This should not happen if the middleware is working correctly, but it's good to have a fallback
            res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        // // Respond with the current user's information
        // res.status(200).json({
        //     success: true,
        //     user: req.user
        // });
    } catch (error) {
        // Log the error and pass it to the next middleware for error handling
        console.log(error);
        next(error);
    }
};

// Get User Data By ID
// This function retrieves user data by the provided userId, excluding the password field.
export const getUserDataById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract userId from the request parameters
        const userId = req.params.userId;

        // Find the user by the provided userId and exclude the password field
        const user: UserDocument | null = await User.findById(userId, '-password').exec();

        // If the user is not found, send a response with a status of  404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Respond with the retrieved user data
        res.status(200).json({ success: true, user });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};

// Get Users By Role
// This function retrieves all users that have a specific role.
export const getUsersByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the role from the request query parameters
        const { role } = req.query;

        // Find the users by the provided role
        const users: UserDocument[] = await User.find({ role }).exec();

        // Respond with the retrieved users
        res.status(200).json({ success: true, users });
    } catch (error) {
        // Log the error and pass it to the next middleware for error handling
        console.log(error);
        next(error);
    }
};


// Get All Users
// This function retrieves all users from the database.
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Retrieve all users from the database
        const users: UserDocument[] = await User.find().exec();

        // Respond with the retrieved users
        res.status(200).json(users);
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};

// Controller method for deleting a user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const userId = req.params.userId;

        // Extract the logged-in user's ID from the request
        const loggedInUserId = (req.user as UserDocument)._id;

        // Check if the userId from the request matches the logged-in user's ID
        if ((req.user as UserDocument).role !== 'admin') {
            // If not, return an error response indicating that only the user can delete their own account
            return res.status(403).json({ success: false, error: 'You are not able to delete.' });
        }

        // Attempt to find and delete the user by their ID
        const result = await User.findByIdAndDelete(userId).exec();

        // If the user is not found or not deleted, send a response with a status of   404 and an error message
        if (!result) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Respond with a success message indicating the user was deleted
        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};

// Update the user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        const body = req?.body?.update;
        const role = body?.role;

        // Define the common properties to be updated
        const commonProperties: Partial<ICommonProperties> = {
            name: body?.name,
            image: body?.image,
            isCompletedProfile: body?.isCompletedProfile,
            telephoneOrPhone: body?.telephoneOrPhone,
            street: body?.street,
            houseOrBuildingNum: body?.houseOrBuildingNum,
            postcode: body?.postcode,
            city: body?.city,
            state: body?.state,
        };

        // Check if the request body is provided
        if (!body) {
            return res.json({ success: false, error: "Please provide a valid data with body." });
        }

        // If the role is 'agent', add the role and taxNumber to the update
        if (role === "agent") {
            commonProperties.role = "agent";
            commonProperties.taxNumber = body?.taxNumber;
        }

        // Prepare the update document
        const updatedDoc = {
            $set: commonProperties
        };

        // Attempt to update the user by their ID with the new data
        const user = await User.findByIdAndUpdate(userId, updatedDoc, { new: true });

        // If the user is not found or not updated, send a response with a status of   404 and an error message
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with a success message indicating the user was updated
        return res.status(200).send({ success: true, message: "User Info Update" });
    } catch (error) {
        // Log the error and pass it to the next middleware for error handling
        console.error('Error updating user:', error);
        next(error);
    }
};


export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract user ID from request parameters
        const userId = req.params.userId;

        // Extract old and new passwords from request body
        const { oldPassword, newPassword } = req.body.update;

        // Fetch the user from the database using the provided user ID
        const user: any = await User.findById(userId);
        // If the user is not found, send a  404 response
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Compare the provided old password with the stored password
        bcrypt.compare(oldPassword, user.password, async (err: Error | null, result: boolean) => {
            // If there's an error during comparison, send a  500 response
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            // If the old password matches, proceed to hash the new password
            if (result) {
                // Hash the new password with a specified number of salt rounds
                bcrypt.hash(newPassword, saltRounds, async (err: Error | null, hash: string) => {
                    try {
                        // Convert the user ID to a MongoDB ObjectId
                        const userIdObjectId = new mongoose.Types.ObjectId(userId);

                        // Prepare the update document with the new hashed password
                        const updatedDoc = {
                            $set: {
                                password: hash
                            }
                        }

                        // Update the user's password in the database
                        const response = await User.updateOne({ _id: userIdObjectId }, updatedDoc);

                        // Send a success response with the updated user data
                        res.send({ success: true, message: "Password Changed", data: response })

                    } catch (error: any) {
                        // If there's an error during the update, send a response with the error message
                        res.send({ success: false, message: error.message })

                        // Pass the error to the next middleware for error handling
                        next(error);
                    }
                });
            } else {
                // If the old password does not match, send a  401 response
                res.status(401).send({ success: false, error: 'Wrong password' });
            }
        });
    } catch (error) {
        // Log any errors that occur during the process
        console.error('Error updating user:', error);
        // Pass the error to the next middleware for error handling
        next(error);
    }
};