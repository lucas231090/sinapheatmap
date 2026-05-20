const UsersRepository = require("../repositories/UserRepository");

/**
 * Controller responsible for retrieving the authenticated user's information.
 */
class GetMeController {
  /**
   * Handles the request to retrieve user information.
   * @param {Object} params - The request parameters.
   * @param {string} params.userId - The ID of the authenticated user.
   * @returns {Promise<Object>} An object containing the HTTP status code and response body.
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
