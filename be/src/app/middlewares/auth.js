const jwt = require("jsonwebtoken");
const authConfig = require("../configs/env");
const logger = require("../configs/logger");

module.exports = async (request, response, next) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return response.status(401).json({ error: "Token does not exist." });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);

    // O token é gerado com o campo "sub" (ver SignInUseCase)
    request.userId = decoded.sub;

    return next();
  } catch (error) {
    logger.error("Token JWT inválido: %s", error.message);
    return response.status(401).json({ error: "Invalid Token." });
  }
};
