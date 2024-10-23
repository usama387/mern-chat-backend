// Importing express for routing
import express from 'express';

// Importing cors for http requests from frontend
import cors from 'cors';

// Importing dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config(); // Initialize dotenv

// Importing cookie-parser for handling cookies
import cookieParser from 'cookie-parser';

// for api routing
import router from './routes/index.js';

// socket configuration for app
import { server, app } from './socket/index.js';




// Use a middleware utilizing express for CORS permission
const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
};

app.use(cors(corsOptions));

// Use another middleware that specifies the inflow and outflow of data will be in JSON format
app.use(express.json());

// Cookie parser will be used on every call
app.use(cookieParser());

app.use("/api", router)

// Call the env port num or else 5000
const PORT = process.env.PORT || 5000;

// Now run the app with listen method on the port
server.listen(PORT, () => {
    console.log("The app is running: " + PORT);
});
