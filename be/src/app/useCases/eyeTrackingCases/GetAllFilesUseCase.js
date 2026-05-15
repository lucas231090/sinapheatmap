const FileRepository = require("../../repositories/FileRepository");

class GetAllFilesUseCase {
  async execute() {
    return await FileRepository.getAllFiles();
  }
}

module.exports = new GetAllFilesUseCase();
