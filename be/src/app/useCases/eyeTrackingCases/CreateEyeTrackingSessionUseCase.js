const EyeTrackingSessionRepository = require("../../repositories/EyeTrackingSessionRepository");
const { eyeTrackingSessionSchema } = require("./EyeTrackingValidation");

/**
 * UseCase to create a new Eye Tracking Session.
 */
class CreateEyeTrackingSessionUseCase {
  /**
   * Executes the creation of an eye tracking session.
   * @param {Object} payload - The raw payload for the session.
   * @returns {Promise<Object>} The created or existing session record.
   * @throws {Error} If validation fails.
   */
  async execute(payload) {
    const validatedData = eyeTrackingSessionSchema.parse(payload);

    const existingSession = await EyeTrackingSessionRepository.findBySessionId(
      validatedData.sessao_id,
    );

    if (existingSession) {
      return existingSession;
    }

    return await EyeTrackingSessionRepository.create(validatedData);
  }
}

module.exports = new CreateEyeTrackingSessionUseCase();
