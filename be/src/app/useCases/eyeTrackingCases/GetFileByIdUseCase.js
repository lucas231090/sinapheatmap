const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase for retrieving a specific file record by its ID.
 */
class GetFileByIdUseCase {
  /**
   * Executes the retrieval of a file by ID.
   * @param {string} id - The unique identifier of the file.
   * @returns {Promise<Object|null>} A promise resolving to the file record, or null if not found.
   */
  async execute(id) {
    return await FileRepository.getFileById(id);
  }
}

module.exports = new GetFileByIdUseCase();
