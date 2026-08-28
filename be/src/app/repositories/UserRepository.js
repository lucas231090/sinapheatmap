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

  /**
   * Retrieves all users from the database.
   * @returns {Promise<Array>} A promise resolving to an array of user documents (without passwords).
   */
  async findAll() {
    return Users.find().select("-password");
  }

  /**
   * Updates an existing user record in the database.
   * @param {string} id - The MongoDB ObjectID of the user to update.
   * @param {Object} updateData - The data to update.
   * @returns {Promise<Object|null>} A promise resolving to the updated user document (without password).
   */
  async update(id, updateData) {
    return Users.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
  }

  /**
   * Deletes a user record from the database.
   * @param {string} id - The MongoDB ObjectID of the user to delete.
   * @returns {Promise<Object|null>} A promise resolving to the deleted user document.
   */
  async delete(id) {
    return Users.findByIdAndDelete(id);
  }

  /**
   * Counts the number of users with the "admin" role.
   * @returns {Promise<number>} A promise resolving to the number of admins.
   */
  async countAdmins() {
    return Users.countDocuments({ role: "admin" });
  }
}

module.exports = new UsersRepository();
