const jwt = require("jsonwebtoken");
const authConfig = require("../configs/env");

module.exports = async (request, response, next) => {
  const authHeader = request.headers.authorization;

  // console.log(authHeader);

  if (!authHeader) {
    return response.status(401).json({ error: "Token does not exist." });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);

    request.userId = decoded.id;

    // console.log(decoded);

    return next();
  } catch (error) {
    console.log(error);
    return response.status(401).json({ error: "Invalid Token." });
  }
};
