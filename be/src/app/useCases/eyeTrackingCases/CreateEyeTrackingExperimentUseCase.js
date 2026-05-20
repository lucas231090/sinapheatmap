const fs = require("fs");
const path = require("path");

const FileRepository = require("../../repositories/FileRepository");
const { uploadsJsonDir } = require("../../configs/uploadsPaths");
const { createExperimentSchema, getExperimentValidationError } = require("./EyeTrackingValidation");

/**
 * UseCase to create a new Eye Tracking Experiment.
 */
class CreateEyeTrackingExperimentUseCase {
  /**
   * Executes the creation of an eye tracking experiment.
   * @param {Object} payload - The raw payload for the experiment.
   * @param {string|null} createdBy - The user ID who is creating the experiment.
   * @returns {Promise<Object>} The newly created experiment file record.
   * @throws {Error} If validation fails or if an experiment with the same name exists.
   */
  async execute(payload, createdBy) {
    const validatedData = createExperimentSchema.parse(payload);
    const validationError = getExperimentValidationError(validatedData);

    if (validationError) {
      const error = new Error(validationError.body.error);
      error.status = validationError.status;
      error.details = validationError.body.details;
      throw error;
    }

    const { name: filename, description = "", experiment: experimentData } = validatedData;
    const existingFile = await FileRepository.findByFilename(filename);

    if (existingFile) {
      const error = new Error("Já existe um experimento com esse nome");
      error.code = "EXPERIMENT_ALREADY_EXISTS";
      throw error;
    }

    const dataToSave = {
      ...experimentData,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    if (!fs.existsSync(uploadsJsonDir)) {
      fs.mkdirSync(uploadsJsonDir, { recursive: true });
    }

    const safeFilename = filename
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "_");
    const jsonPath = path.join(uploadsJsonDir, `${safeFilename}.json`);

    fs.writeFileSync(jsonPath, JSON.stringify(dataToSave, null, 2));

    try {
      return await FileRepository.create({
        filename,
        description,
        path: jsonPath,
        jsonData: dataToSave,
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
