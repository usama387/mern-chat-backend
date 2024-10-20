import express from 'express';
import { getUserDetails, login, logout, registerUser, searchUser, updateUser } from '../controllers/UserController.js';
import { isAuth } from '../middlewares/isAuth.js';

const router = express.Router();

// register user route
router.route("/register").post(registerUser);

// login user route
router.route("/login").post(login)

// logout user route
router.route("/logout").get(logout)

// get user details route first it verifies user in isAuth file if its exists the user is sent with the controller
router.route("/getUserDetails").get(isAuth, getUserDetails)

// update user route
router.route("/updateUser").put(updateUser)

// search user route
router.route("/searchUser").post(searchUser)


export default router;