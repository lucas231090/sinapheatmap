const EyeTrackingSessionRepository = require("../../repositories/EyeTrackingSessionRepository");

class CreateEyeTrackingSessionUseCase {
  async execute(sessionData) {
    const existingSession = await EyeTrackingSessionRepository.findBySessionId(
      sessionData.sessao_id,
    );

    if (existingSession) {
      return existingSession;
    }

    return await EyeTrackingSessionRepository.create(sessionData);
  }
}

module.exports = new CreateEyeTrackingSessionUseCase();
