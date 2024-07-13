import { Request, Response, NextFunction } from 'express';
import Property from '../models/property.model';
import User from '../models/user.model';
import { config as dotenvConfig } from 'dotenv';
import { translateText } from '../utility/translation';
import OpenAI from "openai";

dotenvConfig();

interface Property {
    [key: string]: any;
}



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

export const translateProperties = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { properties, lng, completeData = false }: { properties: Property[], lng: string, completeData: boolean } = req.body;

        if (!properties || !Array.isArray(properties)) return res.status(400).json({ error: 'Invalid properties format' });
        if (!lng) return res.status(400).json({ error: 'Language parameter is required' });

        let translatedProperties: Property[] = [];

        // hr == Croatian language
        if (lng === 'hr') {
            //Handling croatian translation using OpenAI
            translatedProperties = await Promise.all(properties.map((property) => translatePropertyCroatian(property)));
        }
        else {
            // Handling other languages using LibreTranslate
            translatedProperties = await Promise.all(properties.map((property) => translateProperty(property, lng, completeData)));
        }

        res.status(200).json({ success: true, translatedProperties });
    } catch (error) {
        res.status(500).json({ error: 'Failed to translate properties' });
    }
};

const translatePropertyCroatian = async (property: Property): Promise<Property> => {
    // const translatableFields: string[] = ['name', 'location', 'state', 'propertyType', 'description', 'amenities'];
    // let openai: OpenAI;
    // try {
    //     openai = new OpenAI({
    //         apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
    //     });
    // } catch (error) {
    //     console.error("Failed to initialize OpenAI API");
    //     return property;
    // }

    // // Extract only the translatable fields
    // const propertyToTranslate = translatableFields.reduce((obj, key) => {
    //     if (key in property) {
    //         obj[key] = property[key];
    //     }
    //     return obj;
    // }, {} as { [key: string]: any });

    // const propertyString = JSON.stringify(propertyToTranslate, null, 2);

    // const params: OpenAI.Chat.ChatCompletionCreateParams = {
    //     messages: [
    //         { role: 'system', content: "You are a helpful assistant that translates a JSON object's values (not keys) into Croatian and returns the JSON object which has the translated values." },
    //         { role: 'user', content: `Translate the following JSON object's values to Croatian:\n\n${propertyString}` },
    //     ],
    //     model: 'gpt-3.5-turbo',
    // };

    // let chatCompletion: OpenAI.Chat.ChatCompletion;
    // try {
    //     chatCompletion = await openai.chat.completions.create(params);
    // } catch (error) {
    //     console.error("Failed to complete chat with OpenAI API");
    //     return property;
    // }

    // console.log(chatCompletion);

    return property;
}

const translateProperty = async (property: Property, targetLang: string, completeData: boolean): Promise<Property> => {
    const translatableFields: string[] = completeData ? ['name', 'location', 'state', 'propertyType'] : ['location', 'state', 'propertyType'];

    // Combine all field values into a single string separated by newlines
    const propertyText: string = translatableFields
        .map(field => property[field])
        .join('\n');

    let translatedText: string = '';
    try {
        translatedText = await translateText(propertyText, targetLang);
    } catch (error) {
        console.error("Failed to translate key value pairs of property", error);
        return property; // Return original property if translation fails
    }

    // Split the translated text back into individual field values
    const translatedValues: string[] = translatedText.split('\n');
    const translatedProperty: Property = { ...property };

    // Assign the translated values back to the respective fields
    translatableFields.forEach((field, index) => {
        translatedProperty[field] = translatedValues[index];
    });

    if (!completeData) return translatedProperty;
    if (!translatedProperty.amenities || translatedProperty.amenities.length === 0) return translatedProperty;

    const amenitiesText: string = property.amenities.join('\n');
    try {
        const translatedAmenitiesText: string = await translateText(amenitiesText, targetLang);
        const translatedAmenities: string[] = translatedAmenitiesText.split('\n').map((amenity: string) => amenity.trim());
        translatedProperty.amenities = translatedAmenities;
    } catch (error) {
        console.error("Failed to translate amenities", error);
        return translatedProperty;
    }

    if (!translatedProperty.description || translatedProperty.description === '') return translatedProperty;

    try {
        translatedProperty.description = await translateText(translatedProperty.description, targetLang);
    } catch (error) {
        console.error("Failed to translate Description", error);
        return translatedProperty;
    }

    return translatedProperty;
};

export const testOpenAI = async (req: Request, res: Response, next: NextFunction): Promise<string> => {
    try {
        const openai: OpenAI = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
        });

        const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'Say this is a test' }],
            model: 'gpt-3.5-turbo',
        });

        console.log(chatCompletion);
    } catch (error) {
        console.error("Failed to complete chat with OpenAI API", error);
    }

    return '';
}