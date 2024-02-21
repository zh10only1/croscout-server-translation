
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
import { deleteUser, getAllUsers, getCurrentUser, getUserDataById, getUsersByRole, updatePassword, updateUser } from "../controllers/user.controller";



router

    //* Get the current user's profile
    /**
    * @route GET /current-user
    * @description Get the current authenticated user's profile.
    * @access Private (Requires user authentication)
    */
    .get('/current-user', getCurrentUser)

    //* Get user data by user ID
    /**
    * @route GET /by-userid/:userId
    * @description Get user data by user ID.
    * @access Public
    * @param {string} userId - The ID of the user.
    * @returns {object}  200 - An object containing the user data.
    * @returns {object}  404 - An object containing an error message if the user is not found.
    */
    .get('/by-userid/:userId', getUserDataById)

    // Route for getting users by provided role
    //* Get users by role
    /**
    * @route GET /users/by-role
    * @description Get users by role.
    * @access Public
    * @query {string} role - The role of the users to retrieve.
    * @returns {object}  200 - An object containing an array of users.
    */
    .get('/users/by-role', getUsersByRole)

    // Route for getting all users
    //* Get all users
    /**
    * @route GET /all-users
    * @description Get all users.
    * @access Public
    * @returns {object}  200 - An object containing an array of all users.
    */
    .get('/all-users', getAllUsers)

    // Route for deleting a user (must be authenticated)
    //* Delete a user
    /**
    * @route DELETE /:userId
    * @description Delete a user by ID.
    * @access Private (Requires user authentication)
    * @param {string} userId - The ID of the user to delete.
    * @returns {object}  200 - An object containing a success message.
    * @returns {object}  403 - An object containing an error message if the user tries to delete another user's account.
    * @returns {object}  404 - An object containing an error message if the user is not found.
    */
    .delete('/:userId', deleteUser)

    // Route for updating a user (must be authenticated)
    /**
    * @route PUT /:userId
    * @description Update a user by ID.
    * @access Private (Requires user authentication)
    * @param {string} userId - The ID of the user to update.
    * @body {object} update - The user data to update.
    * @returns {object}  200 - An object containing a success message.
    * @returns {object}  404 - An object containing an error message if the user is not found.
    */
    .put('/:userId', updateUser)

    // Route for updating a users password (must be authenticated)
    /**
    * @route PATCH /update-password/:userId
    * @description Update a user's password by ID.
    * @access Private (Requires user authentication)
    * @param {string} userId - The ID of the user to update the password for.
    * @body {object} update - The new password data.
    * @returns {object}  200 - An object containing a success message.
    * @returns {object}  404 - An object containing an error message if the user is not found.
    * @returns {object}  401 - An object containing an error message if the old password is incorrect.
    */
    .patch('/update-password/:userId', updatePassword)

module.exports = router;