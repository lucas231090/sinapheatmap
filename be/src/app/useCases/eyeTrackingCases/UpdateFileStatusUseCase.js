const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase for updating the status (active/inactive) of a file record.
 */
class UpdateFileStatusUseCase {
  /**
   * Executes the status update.
   * @param {string} id - The unique identifier of the file.
   * @param {boolean} status - The new active status.
   * @returns {Promise<Object|null>} A promise resolving to the updated file record, or null if not found.
   */
  async execute(id, status) {
    return await FileRepository.updateFileStatus(id, status);
  }
}

module.exports = new UpdateFileStatusUseCase();
