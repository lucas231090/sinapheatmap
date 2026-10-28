const FileRepository = require("../../repositories/FileRepository");
const fs = require("fs");

/**
 * UseCase for deleting an Eye Tracking experiment.
 */
class DeleteEyeTrackingExperimentUseCase {
  /**
   * Executes the deletion of an experiment.
   * @param {string} id - The MongoDB ObjectID of the file.
   * @returns {Promise<Object>} A promise resolving to the deleted file data.
   * @throws {Error} If the experiment does not exist.
   */
  async execute(id) {
    const existingFile = await FileRepository.getFileById(id);

    if (!existingFile) {
      const error = new Error("Teste não encontrado");
      error.status = 404;
      throw error;
    }

    if (existingFile.path && fs.existsSync(existingFile.path)) {
      fs.unlinkSync(existingFile.path);
    }
    
    if (existingFile.mediaPath && fs.existsSync(existingFile.mediaPath)) {
      fs.unlinkSync(existingFile.mediaPath);
    }

    return await FileRepository.deleteFile(id);
  }
}

module.exports = new DeleteEyeTrackingExperimentUseCase();
