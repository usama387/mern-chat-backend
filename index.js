// Importing express for routing
import express from 'express';

// Importing cors for http requests from frontend
import cors from 'cors';

// Importing dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config(); // Initialize dotenv

// Importing cookie-parser for handling cookies
import cookieParser from 'cookie-parser';

import router from './routes/index.js';


// Storing express in app variable for assigning routes
const app = express();

// Use a middleware utilizing express for CORS permission
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

// Use another middleware that specifies the inflow and outflow of data will be in JSON format
app.use(express.json());

// Cookie parser will be used on every call
app.use(cookieParser());

app.use("/api", router)

// Call the env port num or else 5000
const PORT = process.env.PORT || 5000;

// Now run the app with listen method on the port
app.listen(PORT, () => {
    console.log("The app is running: " + PORT);
});
