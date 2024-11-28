const FileRepository = require("../../repositories/FileRepository");

class GetFileByIdUseCase {
  async execute(id) {
    return await FileRepository.getFileById(id);
  }
}

module.exports = new GetFileByIdUseCase();
