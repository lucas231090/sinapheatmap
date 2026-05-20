const path = require("path");
const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase for retrieving a public Eye Tracking Experiment by its ID.
 * Returns only active experiments, formatted for public consumption.
 */
class GetPublicEyeTrackingExperimentUseCase {
  /**
   * Executes the retrieval of a public experiment.
   * @param {string} id - The unique identifier of the experiment.
   * @returns {Promise<Object|null>} A promise resolving to the formatted experiment data, or null if not found or inactive.
   */
  async execute(id) {
    const experiment = await FileRepository.getFileById(id);

    if (!experiment || !experiment.active) {
      return null;
    }

    return {
      id: experiment._id,
      name: experiment.filename,
      description: experiment.description || "",
      active: experiment.active,
      createdAt: experiment.createdAt,
      experiment: {
        ...(experiment.jsonData || {}),
        mediaPath: experiment.mediaPath
          ? path.basename(experiment.mediaPath)
          : "",
        mediaType: experiment.mediaType ?? 0,
      },
    };
  }
}

module.exports = new GetPublicEyeTrackingExperimentUseCase();
