const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase for retrieving all active file records from the repository.
 */
class GetAllActiveFilesUseCase {
  /**
   * Executes the retrieval of active files.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of active file records.
   */
  async execute() {
    return await FileRepository.getAllActiveFiles();
  }
}

module.exports = new GetAllActiveFilesUseCase();
