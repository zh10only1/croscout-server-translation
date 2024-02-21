import { Request, Response, NextFunction } from 'express';

import FavoriteList from '../models/favorite.model';
import User from '../models/user.model';

// Add to Favorites
// This function allows a user to add or remove a property from their favorite list.
export const addToFavorites = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const { userId } = req.params;
        // Extract the propertyId from the request body
        const { propertyId } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);
        // If the user is not found, send a response with a status of   404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if the user has a role that should not be able to add to favorites
        if (user.role === "agent" || user.role === "admin") {
            return res.status(403).json({ success: false, error: 'Forbidden access' });
        }

        // Check if the propertyId is already in the user's favoriteList
        if (user.favoriteList && Array.isArray(user.favoriteList) && user.favoriteList.includes(propertyId)) {
            // Remove the property from the favorite list
            user.favoriteList = user.favoriteList!.filter(prop => prop.toString() !== propertyId);
            // Save the updated user
            await user.save();
            // Respond with the result
            return res.status(200).json({ success: true, isAdd: false, message: 'Removed the property from the favorite list' });
        } else {
            // If the favorite list is not initialized, initialize it with the propertyId
            if (!user.favoriteList) {
                user.favoriteList = [propertyId];
            } else {
                // Add the propertyId to the user's favoriteList
                user.favoriteList.push(propertyId);
            }
            // Save the updated user
            await user.save();
            // Respond with the result
            return res.status(200).json({ success: true, isAdd: true, message: 'Added the property to the favorite list' });
        }
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};


// Get Favorites
// This function retrieves the favorite list for a user by their ID.
export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const { userId } = req.params;

        // Find the user by ID and populate the 'favoriteList' field with the properties excluding the 'bookedDates' field
        const user = await User.findById(userId).populate('favoriteList', '-bookedDates');
        // If the user or favorite list is not found, send a response with a status of   404 and an error message
        if (!user || !user.favoriteList) {
            return res.status(404).json({ success: false, error: 'User or favorite list not found' });
        }

        // Send a response with a status of   200 and a JSON object containing a success flag and the user's favorite list
        res.status(200).json({ success: true, favoritList: user.favoriteList });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};


// Delete Favorite
// This function allows a user to remove a property from their favorite list.
export const deleteFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const userId = req.params.userId; // Assuming userId is passed as a route parameter

        // Extract the propertyId from the request body
        const { propertyId } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);

        // If the user is not found, send a response with a status of  404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the user's favorite list is empty
        if (user.favoriteList?.length === 0) {
            // If the favorite list is empty, send a response with a status of  404 and an error message
            return res.status(404).json({ success: false, message: 'Property not found in the favorite list in the user' });
        } else {
            // Remove the property from the favorite list
            user.favoriteList = user.favoriteList!.filter(prop => prop.toString() !== propertyId);
        }

        // Save the updated user
        await user.save();

        // Respond with the result
        res.status(200).json({ success: true, message: 'Favorite deleted successfully' });
    } catch (error) {
        // If an error occurs, log the error and send a response with a status of  500 and an error message
        console.error('Error deleting favorite:', error);
        next(error);
    }
};

// Check Favorite Property
// It retrieves the user by ID, finds the user's favorite list, and checks if the property is in the list.
export const checkFavoriteProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the userId from the request parameters
        const { userId } = req.params;

        // Extract the property_id from the request query
        const { property_id } = req.query;

        // Find the user by ID
        const user = await User.findById(userId);

        // If the user is not found, send a response with a status of  404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Retrieve the user's favorite list
        const favoriteList = await FavoriteList.findOne({ user: userId }).populate('properties');

        // If the favorite list is not found, send a response with a status of  404 and an error message
        if (!favoriteList) {
            return res.status(404).json({ success: false, error: 'Favorite list not found' });
        }

        // Check if the property is in the favorite list
        const isInFavorites = favoriteList.properties.some(prop => prop._id.toString() === property_id);

        // Respond with the result
        return res.status(200).json({ success: true, isInFavorites });
    } catch (error) {
        // If an error occurs, pass it to the next middleware for error handling
        next(error);
    }
};