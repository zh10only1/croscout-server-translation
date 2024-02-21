// src/controllers/emailVerification.controller.ts

import { Request, Response, NextFunction } from 'express';
import User, { UserDocument } from '../models/user.model';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { RequestWithUser } from '../types';
import { transporter } from '../utility/mailer';

export const sendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as UserDocument)?._id;


        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }


        const token = crypto.randomBytes(64).toString('hex');
        user.verifyEmailToken = token;
        user.verifyEmailExpires = new Date(Date.now() + 3600000);
        await user.save();

        // Ensure the Gmail user is set
        const gmailUser = process.env.GMAIL_USER;
        if (!gmailUser) {
            throw new Error('GMAIL_USER is not set');
        }

        const mailOptions = {
            from: {
                name: "Croscout",
                address: gmailUser
            },
            to: user.email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking on the following link: \n${process.env.CLIENT_URL}/verify-email?token=${token}`,
        };

        // Send the password reset email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, error: 'Failed to send reset email' });
            }

            res.status(200).json({ success: true, message: 'Verification email sent' });
        });


    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.query.token as string;
        const user = await User.findOne({ verifyEmailToken: token, verifyEmailExpires: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.verifyEmailToken = undefined;
        user.verifyEmailExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        next(error);
    }
};