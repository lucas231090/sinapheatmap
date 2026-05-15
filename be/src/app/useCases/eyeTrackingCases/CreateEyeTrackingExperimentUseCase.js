const fs = require("fs");
const path = require("path");

const FileRepository = require("../../repositories/FileRepository");
const { uploadsJsonDir } = require("../../configs/uploadsPaths");

class CreateEyeTrackingExperimentUseCase {
  async execute({ filename, description = "", experimentData, createdBy }) {
    const existingFile = await FileRepository.findByFilename(filename);

    if (existingFile) {
      const error = new Error("Já existe um experimento com esse nome");
      error.code = "EXPERIMENT_ALREADY_EXISTS";
      throw error;
    }

    if (!fs.existsSync(uploadsJsonDir)) {
      fs.mkdirSync(uploadsJsonDir, { recursive: true });
    }

    const safeFilename = filename
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "_");
    const jsonPath = path.join(uploadsJsonDir, `${safeFilename}.json`);

    fs.writeFileSync(jsonPath, JSON.stringify(experimentData, null, 2));

    try {
      return await FileRepository.create({
        filename,
        description,
        path: jsonPath,
        jsonData: experimentData,
        active: true,
        createdBy,
        experimentType: "eyetracking-experiment",
      });
    } catch (error) {
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
      }

      throw error;
    }
  }
}

module.exports = new CreateEyeTrackingExperimentUseCase();
