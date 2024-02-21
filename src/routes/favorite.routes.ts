
import express from 'express';
import { addToFavorites, checkFavoriteProperty, deleteFavorite, getFavorites } from '../controllers/favorite.controller';

const router = express.Router();

router

    // Add Property to Favorite List
    /**
    * @route POST /api/favorites/:userId
    * @description Adds a property to the user's favorite list.
    * @access Private
    *   
    * @params userId, propertyId
    *   
    * @returns {object} - Status and message indicating if the property was added or removed from the favorite list
    *   
    * @throws {403} If the user is an agent or admin
    * @throws {404} If the user not found
    */
    .post('/:userId', addToFavorites)

    // Get Favorite Properties by UserId
    /**
    * @route GET /api/favorites/:userId
    * @description Retrieves the user's favorite properties.
    * @access Private
    *   
    * @params userId
    *   
    * @returns {object} - Status and an array of favorite properties
    *   
    * @throws {404} If the user or favorite list not found
    */
    .get('/:userId', getFavorites)

    // Delete Property from Favorite List
    /**
    * @route DELETE /api/favorites/:userId
    * @description Deletes a property from the user's favorite list.
    * @access Private
    *   
    * @params userId, propertyId
    *   
    * @returns {object} - Status and message indicating the deletion of the favorite
    *   
    * @throws {404} If the user not found or property not found in the favorite list
    */
    .delete("/:userId", deleteFavorite)

    // Get Favorite Property from Favorite List by user Id
    /**
    * @route GET /api/favorites/:userId/check-favorite
    * @description Checks if a property is in the user's favorite list.
    * @access Private
    *   
    * @params userId, property_id
    *   
    * @returns {object} - Status and a boolean indicating if the property is in the favorite list
    *   
    * @throws {404} If the user not found or favorite list not found
    */
    .get('/:userId/check-favorite', checkFavoriteProperty)

module.exports = router;