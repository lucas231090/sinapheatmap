const fs = require("fs");
const path = require("path");
const multer = require("../../configs/multerConfig");
const { uploadsMediaDir } = require("../../configs/uploadsPaths");

/**
 * UseCase for handling multipart form uploads, extracting a CSV file and an optional media file.
 */
class UploadFilesUseCase {
  /**
   * Determines the media type based on the MIME type.
   * @param {string} mimeType - The MIME type string.
   * @returns {number|null} 0 for image, 1 for video, or null if unknown.
   */
  static getMediaType(mimeType) {
    if (mimeType.startsWith("image/")) {
      return 0; // imagem
    } else if (mimeType.startsWith("video/")) {
      return 1; // vídeo
    } else {
      return null; // tipo desconhecido
    }
  }

  /**
   * Executes the file upload processing using multer.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} A promise resolving to an object containing `csvFile` and `mediaFile` paths.
   */
  execute(request, response) {
    return new Promise((resolve, reject) => {
      multer.fields([
        { name: "csvFile", maxCount: 1 },
        { name: "mediaFile", maxCount: 1 },
      ])(request, response, (err) => {
        if (err) {
          return reject(err);
        }

        const { csvFile, mediaFile } = request.files;
        const { filename } = request.body;

        if (!filename) {
          return reject(new Error("O campo 'filename' é obrigatório."));
        }

        const uploadDir = uploadsMediaDir;
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        let detectedMediaType = null;

        if (mediaFile && mediaFile.length > 0) {
          const originalExtension = path.extname(mediaFile[0].originalname);
          const newMediaPath = path.join(
            uploadDir,
            `${filename}${originalExtension}`,
          );

          // Detectar o tipo de mídia automaticamente
          detectedMediaType = UploadFilesUseCase.getMediaType(
            mediaFile[0].mimetype,
          );

          fs.renameSync(mediaFile[0].path, newMediaPath);
          mediaFile[0].path = newMediaPath;
          mediaFile[0].detectedMediaType = detectedMediaType;
        }

        resolve({
          csvFile: csvFile ? csvFile[0] : null,
          mediaFile: mediaFile
            ? {
                ...mediaFile[0],
                detectedMediaType,
              }
            : null,
        });
      });
    });
  }
}

module.exports = new UploadFilesUseCase();
