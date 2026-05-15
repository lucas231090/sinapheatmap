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

    const accessToken = sign({ role: user.role }, env.jwtSecret, {
      subject: String(user._id),
      // 7 dias é um bom balanço entre segurança e usabilidade
      // Para sessões mais longas, considere implementar refresh token
      expiresIn: "7d",
    });

    return {
      accessToken,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

module.exports = new SignInUseCase();
