import jwt from "jsonwebtoken";

const sendToken = (user, statusCode, res) => {
  // Generate JWT token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Options for cookie
  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // Cookie expiration time
    httpOnly: true, // Cookie accessible only by the web server (not JavaScript)
  };

  // Send response with token stored in cookies
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user,
    token,
  });
};

export default sendToken;
