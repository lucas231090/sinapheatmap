const fs = require("fs");
const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase to handle the logic of updating a heatmap, including file replacement and cleanup.
 */
class UpdateHeatMapUseCase {
  /**
   * Executes the use case.
   * @param {string} id - The ID of the heatmap to update.
   * @param {Object} updateDataInput - The data to update.
   * @param {Object} mediaFile - The uploaded media file object, if any.
   * @returns {Promise<Object>} The updated file data.
   * @throws {Error} If the file is not found or an error occurs during update.
   */
  async execute(id, updateDataInput, mediaFile) {
    const existingFile = await FileRepository.getFileById(id);
    if (!existingFile) {
      const error = new Error("Arquivo não encontrado");
      error.status = 404;
      throw error;
    }

    const updateData = {};

    if (updateDataInput.filename) updateData.filename = updateDataInput.filename;
    if (updateDataInput.description) updateData.description = updateDataInput.description;

    if (mediaFile) {
      if (existingFile.mediaPath && fs.existsSync(existingFile.mediaPath)) {
        fs.unlinkSync(existingFile.mediaPath);
      }

      updateData.mediaPath = mediaFile.path;
    }

    const updatedFile = await FileRepository.updateFile(id, updateData);
    return updatedFile;
  }
}

module.exports = new UpdateHeatMapUseCase();
