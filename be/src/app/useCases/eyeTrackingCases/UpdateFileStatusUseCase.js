const FileRepository = require("../../repositories/FileRepository");

class UpdateFileStatusUseCase {
  async execute(id, status) {
    return await FileRepository.updateFileStatus(id, status);
  }
}

module.exports = new UpdateFileStatusUseCase();
