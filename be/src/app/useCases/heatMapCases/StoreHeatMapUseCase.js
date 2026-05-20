const fs = require("fs");
const UploadFilesUseCase = require("./UploadFileUseCase");
const ProcessCsvDataUseCase = require("./ProcessCsvDataUseCase");
const SaveFileDataUseCase = require("./SaveFileDataUseCase");
const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase to handle the logic of storing a heatmap, including file validation, processing, and cleanup.
 */
class StoreHeatMapUseCase {
  /**
   * Executes the use case.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The saved file data.
   * @throws {Error} If validation, processing, or saving fails.
   */
  async execute(request, response) {
    const { csvFile, mediaFile } = await UploadFilesUseCase.execute(
      request,
      response
    );

    const { filename, description } = request.body;

    if (!filename) {
      if (csvFile) fs.unlinkSync(csvFile.path);
      if (mediaFile) fs.unlinkSync(mediaFile.path);
      const error = new Error("Nome do arquivo é obrigatório");
      error.status = 400;
      throw error;
    }

    const existingFile = await FileRepository.findByFilename(filename);
    if (existingFile) {
      if (csvFile) fs.unlinkSync(csvFile.path);
      if (mediaFile) fs.unlinkSync(mediaFile.path);
      const error = new Error("Um arquivo com esse nome já existe");
      error.status = 400;
      throw error;
    }

    try {
      const results = await ProcessCsvDataUseCase.execute(csvFile.path);
      const processedData = ProcessCsvDataUseCase.processHeatmapData(results);

      const savedFile = await SaveFileDataUseCase.execute(
        {
          filename,
          description,
          path: csvFile.path,
          mediaPath: mediaFile?.path || null,
          mediaType: mediaFile?.detectedMediaType || 0,
        },
        processedData
      );

      fs.unlinkSync(csvFile.path);
      return savedFile;
    } catch (error) {
      if (csvFile && fs.existsSync(csvFile.path)) {
        fs.unlinkSync(csvFile.path);
      }
      if (mediaFile && fs.existsSync(mediaFile.path)) {
        fs.unlinkSync(mediaFile.path);
      }
      throw error;
    }
  }
}

module.exports = new StoreHeatMapUseCase();
