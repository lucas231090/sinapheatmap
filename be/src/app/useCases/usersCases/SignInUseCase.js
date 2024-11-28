const { compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const UsersRepository = require("../../repositories/UserRepository");
const env = require("../../configs/env");
const InvalidCredentials = require("../../errors/InvalidCredentials");

class SignInUseCase {
  async execute({ email, password }) {
    const user = await UsersRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentials();
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentials();
    }

    const accessToken = sign({ sub: user._id }, env.jwtSecret, {
      expiresIn: "90d",
    });

    return {
      accessToken,
    };
  }
}

module.exports = new SignInUseCase();
