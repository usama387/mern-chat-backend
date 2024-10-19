// importing express for routing
const express = require("express");

// importing cors for http requests from frontend
const cors = require("cors");

// to env file
require("dotenv").config();

// to use cookies
const cookieParser = require("cookie-parser");

// storing express in app variable for assigning routes
const app = express();

// use is a middleware utilizing express for cors permission
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}))

// use is another middleware that specifies the inflow and outflow of data will be in json format
app.use(express.json());

// cookie parser will be used on every call
app.use(cookieParser());

// call the env port num or else 5000
const PORT = process.env.PORT || 5000;

// now run the app with listen method on the port
app.listen(PORT, () => {
    console.log("The app is running: " + PORT);
})