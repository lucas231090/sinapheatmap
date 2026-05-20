const { hash } = require("bcryptjs");
const UsersRepository = require("../../repositories/UserRepository");
const AccountAlreadyExists = require("../../errors/AccountAlreadyExists");

/**
 * UseCase for user registration (Sign Up).
 */
class SignUpUseCase {
  /**
   * Initializes the use case, utilizing a singleton pattern.
   */
  constructor() {
    if (SignUpUseCase.instance) {
      return SignUpUseCase.instance;
    }

    this.saltRounds = 10;
    SignUpUseCase.instance = this;
  }

  /**
   * Executes the sign-up logic.
   * @param {Object} userData - The new user's information.
   * @param {string} userData.email - The user's email address.
   * @param {string} userData.name - The user's full name.
   * @param {string} userData.password - The user's plaintext password.
   * @returns {Promise<Object>} A promise resolving to the created user's information (without password).
   * @throws {AccountAlreadyExists} If a user with the provided email already exists.
   */
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
