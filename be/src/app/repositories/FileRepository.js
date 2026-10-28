const File = require("../models/File");

/**
 * Repository for handling database operations related to Files.
 */
class FileRepository {
  /**
   * Finds a file by its unique filename.
   * @param {string} filename - The exact filename to search for.
   * @returns {Promise<Object|null>} A promise resolving to the file document, or null if not found.
   */
  async findByFilename(filename) {
    return await File.findOne({ filename });
  }

  /**
   * Creates and saves a new file record in the database.
   * @param {Object} fileData - The data to initialize the new file.
   * @returns {Promise<Object>} A promise resolving to the saved file document.
   */
  async create(fileData) {
    const file = new File(fileData);
    return await file.save();
  }

  /**
   * Retrieves all file records from the database.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of file documents.
   */
  async getAllFiles() {
    return await File.find();
  }

  /**
   * Retrieves all file records that are marked as active.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of active file documents.
   */
  async getAllActiveFiles() {
    return await File.find({ active: true });
  }

  /**
   * Finds a file by its database ID.
   * @param {string} id - The MongoDB ObjectID of the file.
   * @returns {Promise<Object|null>} A promise resolving to the file document, or null if not found.
   */
  async getFileById(id) {
    return await File.findById(id);
  }

  /**
   * Counts how many file records still reference a given media path.
   * @param {string} mediaPath - The media path to search for.
   * @param {string} [excludeId] - Optional file ID to exclude from the count.
   * @returns {Promise<number>} The number of matching records.
   */
  async countByMediaPath(mediaPath, excludeId = null) {
    const query = { mediaPath };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await File.countDocuments(query);
  }

  /**
   * Updates a file by its database ID.
   * @param {string} id - The MongoDB ObjectID of the file.
   * @param {Object} updateData - An object containing fields to update.
   * @returns {Promise<Object|null>} A promise resolving to the updated file document, or null if not found.
   */
  async updateFile(id, updateData) {
    return await File.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Updates the active status of a file.
   * @param {string} id - The MongoDB ObjectID of the file.
   * @param {boolean} active - The new active status.
   * @returns {Promise<Object|null>} A promise resolving to the updated file document, or null if not found.
   */
  async updateFileStatus(id, active) {
    return await File.findByIdAndUpdate(id, { active }, { new: true });
  }
  /**
   * Deletes a file by its database ID.
   * @param {string} id - The MongoDB ObjectID of the file.
   * @returns {Promise<Object|null>} A promise resolving to the deleted file document, or null if not found.
   */
  async deleteFile(id) {
    return await File.findByIdAndDelete(id);
  }
}

module.exports = new FileRepository();
