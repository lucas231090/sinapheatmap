const fs = require("fs");
const path = require("path");
const multer = require("../../configs/multerConfig");

class UploadFilesUseCase {
  // Função para determinar o tipo de mídia usando MIME type
  // Retorna 0 para imagem, 1 para vídeo
  static getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 0; // imagem
    } else if (mimeType.startsWith('video/')) {
      return 1; // vídeo
    } else {
      return null; // tipo desconhecido
    }
  }

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

        const uploadDir = path.join(__dirname, "../../uploads/media");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        let detectedMediaType = null;

        if (mediaFile && mediaFile.length > 0) {
          const originalExtension = path.extname(mediaFile[0].originalname);
          const newMediaPath = path.join(
            uploadDir,
            `${filename}${originalExtension}`
          );

          // Detectar o tipo de mídia automaticamente
          detectedMediaType = UploadFilesUseCase.getMediaType(mediaFile[0].mimetype);

          fs.renameSync(mediaFile[0].path, newMediaPath);
          mediaFile[0].path = newMediaPath;
          mediaFile[0].detectedMediaType = detectedMediaType;
        }

        resolve({
          csvFile: csvFile ? csvFile[0] : null,
          mediaFile: mediaFile ? {
            ...mediaFile[0],
            detectedMediaType
          } : null,
        });
      });
    });
  }
}

module.exports = new UploadFilesUseCase();
