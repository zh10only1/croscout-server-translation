const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router
    //* User Registration Route
    /**
     * @route POST /api/auth/register
     * @description Register a new user.
     * @access Public
     *  
     * @params name, email, password, role, taxNumber (optional)
     *  
     * @returns {object} - Registration status and message
     *  
     * @throws {409} If the user already exists
     * @throws {400} If there are validation errors in the request body
     * @throws {500} If there's an Internal server error
     */
    .post('/register', authController.registerUser)


    //* User Login Route
    /**
    * @route POST /api/auth/login
    * @description Authenticates a user and logs them in.
    * @access Public
    *  
    * @params email, password
    *  
    * @returns {object} - Login status and message, JWT token
    *  
    * @throws {400} If there are validation errors in the request body
    * @throws {401} If there are wrong password errors
    * @throws {404} If the user does not exist
    */
    .post('/login', authController.loginUser)


    //* User logout route
    /**
    * @route GET /api/auth/logout
    * @description Logs out the current user.
    * @access Private
    *  
    * @params None
    *  
    * @returns {object} - Logout status
    *  
    * @throws {401} If the user is not authenticated
    */
    .get('/logout', authController.logOutUser)


    //* Forgot password route
    /**
    * @route POST /api/auth/forgot-password
    * @description Initiates the password reset process by sending a reset link to the user's email.
    * @access Public
    *  
    * @params email, clientUrl
    *  
    * @returns {object} - Status and message
    *  
    * @throws {404} If the user does not exist
    * @throws {500} If there's an Internal server error
    */
    .post('/forgot-password', authController.forgotPassword)


    //* Reset password route
    /**
    * @route POST /api/auth/reset-password
    * @description Resets the user's password using a token received in the email.
    * @access Public
    *  
    * @params token, newPassword
    *  
    * @returns {object} - Status and message
    *  
    * @throws {400} If the token is invalid or expired
    * @throws {404} If the user does not exist
    */
    .post('/reset-password', authController.resetPassword)


module.exports = router;