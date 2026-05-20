const path = require("path");
const FileRepository = require("../../repositories/FileRepository");

class GetPublicEyeTrackingExperimentUseCase {
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
