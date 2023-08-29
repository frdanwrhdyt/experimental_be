const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  const accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  try {
    const decodedToken = jwt.verify(
      accessToken.split(" ")[1], // Extract token from "Bearer [token]"
      process.env.ACCESS_TOKEN_SECRET
    );
    req.user = decodedToken.user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid access token" });
  }
});

module.exports = verifyAccessToken;
