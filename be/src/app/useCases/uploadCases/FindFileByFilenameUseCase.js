const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase for checking if a file with a specific name already exists.
 */
class FindFileByFilenameUseCase {
  /**
   * Executes the search for a file by filename.
   * @param {string} filename - The exact filename to search for.
   * @returns {Promise<Object|null>} A promise resolving to the file record, or null if not found.
   * @throws {Error} If an error occurs during the database query.
   */
  async execute(filename) {
    try {
      const file = await FileRepository.findByFilename(filename);
      return file;
    } catch (error) {
      throw new Error(`Erro ao buscar arquivo por nome: ${error.message}`);
    }
  }
}

module.exports = new FindFileByFilenameUseCase();
