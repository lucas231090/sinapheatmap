const UsersRepository = require("../repositories/UserRepository");

class GetMeController {
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
