const fs = require("fs");
const path = require("path");

const FileRepository = require("../../repositories/FileRepository");
const { uploadsJsonDir } = require("../../configs/uploadsPaths");
const { createExperimentSchema, getExperimentValidationError } = require("./EyeTrackingValidation");

/**
 * UseCase to update an Eye Tracking Experiment.
 */
class UpdateEyeTrackingExperimentUseCase {
  /**
   * Executes the update of an eye tracking experiment.
   * @param {string} id - The ID of the experiment to update.
   * @param {Object} payload - The raw payload for the experiment.
   * @param {string|null} updatedBy - The user ID who is updating the experiment.
   * @returns {Promise<Object|null>} The updated experiment file record, or null if not found.
   * @throws {Error} If validation fails or if a conflicting experiment exists.
   */
  async execute(id, payload, updatedBy) {
    const validatedData = createExperimentSchema.parse(payload);
    const validationError = getExperimentValidationError(validatedData);

    if (validationError) {
      const error = new Error(validationError.body.error);
      error.status = validationError.status;
      error.details = validationError.body.details;
      throw error;
    }

    const { name: filename, description = "", experiment: experimentData } = validatedData;
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

    const dataToSave = {
      ...experimentData,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

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

    fs.writeFileSync(jsonPath, JSON.stringify(dataToSave, null, 2));

    return await FileRepository.updateFile(id, {
      filename: filename || existingFile.filename,
      description,
      jsonData: dataToSave,
      path: jsonPath,
    });
  }
}

module.exports = new UpdateEyeTrackingExperimentUseCase();
