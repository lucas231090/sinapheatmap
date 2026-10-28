const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase for retrieving all file records from the repository.
 */
class GetAllFilesUseCase {
  /**
   * Executes the retrieval of all files.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of file records.
   */
  async execute() {
    return await FileRepository.getAllFiles();
  }
}

module.exports = new GetAllFilesUseCase();
