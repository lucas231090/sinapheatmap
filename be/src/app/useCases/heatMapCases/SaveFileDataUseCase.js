const fs = require("fs");
const path = require("path");
const FileRepository = require("../../repositories/FileRepository");

class SaveFileDataUseCase {
  async execute(fileData, processedData) {
    const jsonFilename = `${fileData.filename}.json`;
    const jsonDir = path.join(__dirname, "../../uploads/json");
    const mediaDir = path.join(__dirname, "../../uploads/media");

    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const jsonPath = path.join(jsonDir, jsonFilename);

    fs.writeFileSync(jsonPath, JSON.stringify(processedData, null, 2));

    const mediaPath = fileData.mediaPath
      ? path.join(mediaDir, path.basename(fileData.mediaPath))
      : null;

    if (mediaPath && fs.existsSync(fileData.mediaPath)) {
      fs.renameSync(fileData.mediaPath, mediaPath);
    }

    const savedFile = await FileRepository.create({
      filename: fileData.filename,
      description: fileData.description,
      path: jsonPath,
      mediaPath: mediaPath,
      jsonData: processedData,
    });

    return savedFile;
  }
}

module.exports = new SaveFileDataUseCase();
