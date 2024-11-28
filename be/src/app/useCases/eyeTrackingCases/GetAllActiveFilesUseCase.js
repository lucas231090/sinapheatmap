const FileRepository = require("../../repositories/FileRepository");

class GetAllActiveFilesUseCase {
  async execute() {
    return await FileRepository.getAllActiveFiles();
  }
}

module.exports = new GetAllActiveFilesUseCase();
