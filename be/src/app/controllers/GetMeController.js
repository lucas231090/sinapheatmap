const UsersRepository = require("../repositories/UserRepository");

/**
 * Controller responsible for retrieving the authenticated user's information.
 * Provides the functionality to fetch user details based on their ID,
 * usually extracted from the authentication token.
 */
class GetMeController {
  /**
   * Handles the request to retrieve user information.
   * Uses the UsersRepository to find the user by ID and returns a sanitized user object.
   *
   * @param {Object} params - The request parameters object.
   * @param {string} params.userId - The ID of the authenticated user.
   * @returns {Promise<Object>} An object containing the HTTP status code (200 or 404) and the response body.
   */
  async handle({ userId }) {
    const user = await UsersRepository.findById(userId);

    if (!user) {
      return {
        statusCode: 404,
        body: {
          error: "User not found.",
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }
}

module.exports = new GetMeController();
