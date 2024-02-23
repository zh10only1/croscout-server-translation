import { Request, Response, NextFunction } from 'express';
import Property from '../models/property.model';
import User from '../models/user.model';

export const createProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const property = new Property(req.body);
        await property.save();


        res.status(201).json({ success: true, message: "Property Created Successfully" });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Get Properties
// This function retrieves properties based on the provided filters (location, guest count, property type).
export const getProperties = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Initialize an empty filter object
        const filter: { state?: RegExp, guests?: { $gte: number }, propertyType?: RegExp } = {};
        // Extract query parameters for location, guest count, and property type
        const location = req.query.location;
        const guest = req.query.guest;
        const category = req.query.category;
        const price = req.query.price;
        const alphabate = req.query.alphabate;
        const newest = req.query.newest;
        const reqlimit = req.query.limit;

        let limit = 20;

        if (reqlimit) {
            limit = parseInt(reqlimit as string, 10);
        }

        // If location is provided, add a case-insensitive regex filter for the state
        if (typeof location === "string") {
            filter.state = new RegExp(location, 'i');
        }
        // If guest count is provided, add a filter for properties with at least that many guests
        if (typeof guest === "string") {
            filter.guests = { $gte: parseInt(guest, 10) };
        }
        // If property type is provided, add a case-insensitive regex filter for the property type
        if (typeof category === "string") {
            filter.propertyType = new RegExp(category, 'i');
        }

        const sort: { [key: string]: string } = {};

        if (alphabate === "asc" || alphabate === "desc") {
            sort.state = alphabate
        }

        if (price === "asc" || price === "desc") {
            sort.pricePerNight = price
        }

        if (newest === "true") {
            sort._id = "desc";
        }


        // Find properties that match the filter criteria
        const properties = await Property.find(filter).sort(sort as any).limit(limit).populate('feedbacks', 'rating -_id');

        // Respond with the found properties
        res.status(200).json({ success: true, properties });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};

// Get Single Property
// This function retrieves a single property by its ID and returns it with the owner's information excluding sensitive fields.
export const getSingleProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the property ID from the request parameters
        const { id } = req.params;
        // Find the property by ID and populate the 'owner' field with the owner's information, excluding email, password, and role
        const property = await Property.findById(id).populate('owner', '-email -password -role');
        // If the property is not found, send a response with a status of  404 and an error message
        if (!property) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }
        // Respond with the found property
        res.status(200).json({ success: true, property });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};

// Get Properties By User
// This function retrieves all properties owned by a specific user.
export const getPropertiesByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the email from the request parameters
        const { email } = req.params;

        // Find the user by email
        const user = await User.findOne({ email });

        // If the user is not found, send a response with a status of   404 and an error message
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Find all properties owned by the user and populate the 'owner' field
        const properties = await Property.find({ owner: user._id }).populate('owner');

        // Respond with the found properties
        res.status(200).json({ success: true, properties });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};


// Delete Property by ID
// This function deletes a property by its ID from the database.
export const deleteProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the property ID from the request parameters
        const { id } = req.params;

        // Attempt to find and delete the property by its ID
        const deletedProperty = await Property.findByIdAndDelete(id);

        // If the property is not found or not deleted, send a response with a status of  404 and an error message
        if (!deletedProperty) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }

        // Respond with a success message indicating the property was deleted
        res.status(200).json({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};

// Update Property by ID
// This function updates a property by its ID with the provided update data.
export const updateProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updateDocuments = req.body;

        // Check if updateDocuments is empty
        if (Object.keys(updateDocuments).length === 0) {
            return res.status(400).json({ success: false, error: 'No update data provided' });
        }

        // Attempt to update the property by its ID with the new data
        const updatedProperty = await Property.findByIdAndUpdate(id, updateDocuments, { new: true });

        // If the property is not found or not updated, send a response with a status of   404 and an error message
        if (!updatedProperty) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }

        // Respond with a success message indicating the property was updated
        res.status(200).json({ success: true, message: 'Updated Successfully' });
    } catch (error) {
        // Pass any errors to the next middleware for error handling
        next(error);
    }
};