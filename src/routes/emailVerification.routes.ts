import express from 'express';
import { sendVerificationEmail, verifyEmail } from '../controllers/emailVerification.controller';
import { checkSecureUser } from '../middleware/authentication';

const router = express.Router();

router

    .post('/send-verification-email', checkSecureUser, sendVerificationEmail)

    .get('/verify-email', verifyEmail);

module.exports = router;