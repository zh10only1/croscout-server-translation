const express = require('express');
import { createFeedback, getFeedbacksForProperty } from '../controllers/feedback.controller';
import { createProperty, getProperties, getSingleProperty, getPropertiesByUser, updateProperty, deleteProperty } from '../controllers/property.controller';
import { checkSecureUser } from '../middleware/authentication';

const router = express.Router();

router

    // Create a Property
    /**
    * @route POST /api/properties
    * @description Creates a new property.
    * @access Private
    *   
    * @returns {object} - Status and message indicating the property was created successfully
    */
    .post('/', checkSecureUser, createProperty)

    // Get All Properties
    /**
    * @route GET /api/properties
    * @description Retrieves all properties.
    * @access Public
    *   
    * @returns {object} - Status and an array of properties
    */
    .get('/', getProperties)

    // Get a Single Property by Property ID
    /**
    * @route GET /api/properties/:id
    * @description Retrieves a single property by its ID.
    * @access Public
    *   
    * @params id
    *   
    * @returns {object} - Status and the property details
    *   
    * @throws {404} If the property not found
    */
    .get('/:id', getSingleProperty)

    // Get Properties by User
    /**
    * @route GET /api/properties/user/:email
    * @description Retrieves all properties for a user based on their email.
    * @access Private
    *   
    * @params email
    *   
    * @returns {object} - Status and an array of properties
    *   
    * @throws {404} If the user not found
    */
    .get('/user/:email', checkSecureUser, getPropertiesByUser)

    // Update Property by ID
    /**
    * @route PUT /api/properties/:id
    * @description Updates a property by its ID.
    * @access Private
    *   
    * @params id
    *   
    * @returns {object} - Status and message indicating the property was updated successfully
    *   
    * @throws {404} If the property not found
    */
    .put('/:id', checkSecureUser, updateProperty)

    // Delete Property by ID
    /**
    * @route DELETE /api/properties/:id
    * @description Deletes a property by its ID.
    * @access Private
    *   
    * @params id
    *   
    * @returns {object} - Status and message indicating the property was deleted successfully
    *   
    * @throws {404} If the property not found
    */
    .delete('/:id', checkSecureUser, deleteProperty)

    .post('/feedback', checkSecureUser, createFeedback)

    .get('/:propertyId/feedbacks', getFeedbacksForProperty)

module.exports = router;