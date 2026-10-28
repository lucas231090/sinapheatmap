const EyeTrackingSession = require("../../models/EyeTrackingSession");
const isValidId = require("../../utils/isValidId");

/**
 * UseCase for retrieving all eye tracking sessions for a specific experiment.
 */
class GetEyeTrackingSessionsUseCase {
  /**
   * Executes the retrieval of sessions.
   * @param {string} experimentId - The ID of the experiment.
   * @returns {Promise<Array>} A promise resolving to an array of sessions.
   */
  async execute(experimentId) {
    if (!isValidId(experimentId)) {
      const error = new Error("ID do experimento inválido");
      error.status = 400;
      throw error;
    }

    const sessions = await EyeTrackingSession.find({
      experimento_id: experimentId,
    }).sort({ createdAt: 1 });

    return sessions;
  }
}

module.exports = new GetEyeTrackingSessionsUseCase();
