const { hash } = require("bcryptjs");
const UsersRepository = require("../../repositories/UserRepository");
const AccountAlreadyExists = require("../../errors/AccountAlreadyExists");

class SignUpUseCase {
  constructor() {
    if (SignUpUseCase.instance) {
      return SignUpUseCase.instance;
    }

    this.saltRounds = 10;
    SignUpUseCase.instance = this;
  }

  async execute({ email, name, password }) {
    const existingUser = await UsersRepository.findByEmail(email);
    if (existingUser) {
      throw new AccountAlreadyExists();
    }

    const hashedPassword = await hash(password, this.saltRounds);

    const newUser = await UsersRepository.create({
      name,
      email,
      password: hashedPassword,
      role: "researcher",
    });

    return {
      id: String(newUser._id),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  }
}

module.exports = new SignUpUseCase();
