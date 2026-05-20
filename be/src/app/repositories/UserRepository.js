const Users = require("../models/User");

/**
 * Repository for handling database operations related to Users.
 */
class UsersRepository {
  /**
   * Finds a user by their MongoDB ID, excluding their password field.
   * @param {string} id - The MongoDB ObjectID of the user.
   * @returns {Promise<Object|null>} A promise resolving to the user document, or null if not found.
   */
  async findById(id) {
    const user = await Users.findById(id).select("-password");
    return user;
  }

  /**
   * Finds a user by their email address.
   * @param {string} email - The user's exact email address.
   * @returns {Promise<Object|null>} A promise resolving to the user document, or null if not found.
   */
  async findByEmail(email) {
    return Users.findOne({ email });
  }

  /**
   * Creates a new user record in the database.
   * @param {Object} userData - The data for the new user.
   * @returns {Promise<Object>} A promise resolving to the newly created user document.
   */
  async create(userData) {
    return Users.create(userData);
  }
}

module.exports = new UsersRepository();
