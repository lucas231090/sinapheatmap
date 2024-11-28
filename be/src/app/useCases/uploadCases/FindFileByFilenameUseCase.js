const FileRepository = require("../../repositories/FileRepository");

class FindFileByFilenameUseCase {
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
