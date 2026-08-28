const UserRepository = require("../repositories/UserRepository");

async function adminMiddleware(request, response, next) {
  try {
    const { userId } = request;
    if (!userId) {
      return response.status(401).json({ error: "User not authenticated" });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return response.status(403).json({ error: "Access denied. Admin role required." });
    }

    next();
  } catch (error) {
    return response.status(500).json({ error: "Internal server error" });
  }
}

module.exports = adminMiddleware;
