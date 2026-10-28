const upload = require("../configs/multerConfig");
const UploadCsvUseCase = require("../useCases/uploadCases/UploadCsvUseCase");
const FindFileByFilenameUseCase = require("../useCases/uploadCases/FindFileByFilenameUseCase");
const logger = require("../configs/logger");

/**
 * Controller responsible for handling CSV file uploads.
 * This controller manages the process of receiving a CSV file from a client,
 * validating it, parsing its contents, and delegating the persistence of
 * the data to the appropriate UseCase.
 */
class CsvController {
  /**
   * Stores an uploaded CSV file.
   * Uses Multer for handling multipart/form-data to extract the uploaded file.
   * Checks if a file with the same filename already exists, then delegates
   * the storage process to the UploadCsvUseCase.
   * 
   * @param {Object} request - The Express HTTP request object containing the file and body parameters (filename, description).
   * @param {Object} response - The Express HTTP response object used to send back the result.
   * @returns {Promise<void>} Sends a JSON response with status 200 on success, or 400/500 on error.
   */
  async store(request, response) {
    upload.single("file")(request, response, async (err) => {
      if (err) {
        logger.error("Erro ao fazer upload do arquivo: %s", err.message);
        let errorMsg;
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            errorMsg =
              "Arquivo muito grande. O tamanho máximo permitido é XX Mb.";
            break;
          case "LIMIT_UNEXPECTED_FILE":
            errorMsg = "Tipo de arquivo inesperado.";
            break;
          default:
            errorMsg = "Erro ao fazer upload do arquivo.";
        }
        return response
          .status(400)
          .json({ error: errorMsg, details: err.message });
      }

      const { file } = request;
      const { filename, description } = request.body;

      try {
        const existingFile = await FindFileByFilenameUseCase.execute(filename);
        if (existingFile) {
          return response
            .status(400)
            .json({ error: "Um arquivo com esse nome já existe" });
        }

        const savedFile = await UploadCsvUseCase.execute(
          file,
          filename,
          description
        );

        return response.status(200).json({
          message: "Arquivo CSV processado e dados salvos com sucesso!",
          data: savedFile,
        });
      } catch (error) {
        logger.error("Erro ao processar o arquivo CSV: %s", error.message);
        return response.status(500).json({
          error: "Erro ao processar o arquivo CSV",
          details: error.message,
        });
      }
    });
  }
}

module.exports = new CsvController();
