const fs = require("fs");
const path = require("path");

const FileRepository = require("../../repositories/FileRepository");
const { uploadsJsonDir } = require("../../configs/uploadsPaths");

class UpdateEyeTrackingExperimentUseCase {
  async execute({ id, filename, description = "", experimentData }) {
    const existingFile = await FileRepository.getFileById(id);

    if (!existingFile) {
      return null;
    }

    if (filename && filename !== existingFile.filename) {
      const conflict = await FileRepository.findByFilename(filename);

      if (conflict && String(conflict._id) !== String(id)) {
        const error = new Error("Ja existe um experimento com esse nome");
        error.code = "EXPERIMENT_ALREADY_EXISTS";
        throw error;
      }
    }

    if (!fs.existsSync(uploadsJsonDir)) {
      fs.mkdirSync(uploadsJsonDir, { recursive: true });
    }

    let jsonPath = existingFile.path;
    if (!jsonPath) {
      const safeFilename = (filename || existingFile.filename || "experimento")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "_");
      jsonPath = path.join(uploadsJsonDir, `${safeFilename}.json`);
    }

    fs.writeFileSync(jsonPath, JSON.stringify(experimentData, null, 2));

    return await FileRepository.updateFile(id, {
      filename: filename || existingFile.filename,
      description,
      jsonData: experimentData,
      path: jsonPath,
    });
  }
}

module.exports = new UpdateEyeTrackingExperimentUseCase();
