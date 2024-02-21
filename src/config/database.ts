import mongoose from "mongoose";
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();


const dbConnectionUrl = process.env.DB_CONNECTION_URL;
if (!dbConnectionUrl) {
    throw new Error("DB_CONNECTION_URL is not defined in the environment variables.");
}


mongoose
    .connect(dbConnectionUrl)
    .then(() => {
        console.log('Database Connected');
    })
    .catch((err: any) => {
        console.log(err.message);
    });