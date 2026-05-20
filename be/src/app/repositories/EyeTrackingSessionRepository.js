const EyeTrackingSession = require("../models/EyeTrackingSession");

class EyeTrackingSessionRepository {
  async create(sessionData) {
    const session = new EyeTrackingSession(sessionData);
    return await session.save();
  }

  async findBySessionId(sessaoId) {
    return await EyeTrackingSession.findOne({ sessao_id: sessaoId });
  }
}

module.exports = new EyeTrackingSessionRepository();
