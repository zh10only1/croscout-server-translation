import nodemailer from 'nodemailer';
import dotenv from "dotenv"
dotenv.config();

// Create a Nodemailer transporter using Gmail service
// This transporter will be used to send emails from the application
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // Use the Gmail user and app ID from environment variables
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_ID
    }
});