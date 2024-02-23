import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import { config as dotenvConfig } from 'dotenv';
// const cookieParser = require('cookie-parser')


// Define all the routes for the application
const authRoutes = require('./routes/auth.routes');
const emailVerificationRoutes = require('./routes/emailVerification.routes');
const userRoutes = require('./routes/user.routes');
const propertyRoutes = require('./routes/property.routes');
const favoritesRoutes = require('./routes/favorite.routes');
const bookingRoutes = require('./routes/booking.routes');
const transactionRoutes = require('./routes/transaction.routes');
const dashboardRoutes = require('./routes/dashboard.routes');



// Load environment variables from .env file
dotenvConfig();

// Load Database and Passport configuration
import "./config/database"
import "./config/passport"

const app = express();

app.use(express.json());
// app.use(cors());

app.use(cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, "http://localhost:3000", "https://airbnb-clone-git-dev-arif-hossainarif37.vercel.app"] : "http://localhost:3000" || '*',
    methods: "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    credentials: true
}));
// app.use(cookieParser());


// Configure express-session middleware
app.use(session({
    secret: process.env.JWT_SECRET_KEY || 'fallbackSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if you are using HTTPS
}));

app.use(express.urlencoded({ extended: true }));

// Passport and Session Initialize
app.use(passport.initialize());
app.use(passport.session());

// Home route
app.get('/', (req, res) => {
    res.send('Welcome to Airbnb server');
});

//**---------------- API Routes Start --------------------**//
// Define all the routes for the application
import { checkSecureUser } from "./middleware/authentication"

// Authentication Routes
app.use('/api/auth', authRoutes);

// Email Verification Routes
app.use('/api/email-verification', emailVerificationRoutes);

// Properties Routes
app.use('/api/properties', propertyRoutes);

// User Routes
app.use('/api/user', checkSecureUser, userRoutes);

// Favorites Routes
app.use('/api/favorites', checkSecureUser, favoritesRoutes);

// Booking Routes
app.use('/api/bookings', checkSecureUser, bookingRoutes);

// Transaction Routes
app.use('/api/transactions', checkSecureUser, transactionRoutes);

// Dashboard Routes
app.use('/api/dashboard', checkSecureUser, dashboardRoutes);

//**---------------- API Routes End --------------------**//


// Route not found
app.use((req, res, next) => {
    res.status(404).json({ message: 'route not found' });
});

// Server error
// import errorHandler from './errorHandlers/errorHandler';
// app.use(errorHandler);

// Start the server
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//* server error
import errorHandler from './errorHandlers/errorHandler';
app.use(errorHandler);


export default app;

