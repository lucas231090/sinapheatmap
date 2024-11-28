const fs = require("fs");
const path = require("path");
const multer = require("../../configs/multerConfig");

class UploadFilesUseCase {
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

        if (mediaFile && mediaFile.length > 0) {
          const originalExtension = path.extname(mediaFile[0].originalname);
          const newMediaPath = path.join(
            uploadDir,
            `${filename}${originalExtension}`
          );

          fs.renameSync(mediaFile[0].path, newMediaPath);
          mediaFile[0].path = newMediaPath;
        }

        resolve({
          csvFile: csvFile ? csvFile[0] : null,
          mediaFile: mediaFile ? mediaFile[0] : null,
        });
      });
    });
  }
}

module.exports = new UploadFilesUseCase();
