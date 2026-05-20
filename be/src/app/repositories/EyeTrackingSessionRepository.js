const EyeTrackingSession = require("../models/EyeTrackingSession");

/**
 * Repository for handling database operations related to Eye Tracking Sessions.
 */
class EyeTrackingSessionRepository {
  /**
   * Creates and saves a new session record in the database.
   * @param {Object} sessionData - The session data payload.
   * @returns {Promise<Object>} A promise resolving to the saved session document.
   */
  async create(sessionData) {
    const session = new EyeTrackingSession(sessionData);
    return await session.save();
  }

  /**
   * Finds an existing session by its explicit `sessao_id`.
   * @param {string} sessaoId - The unique session ID provided by the client.
   * @returns {Promise<Object|null>} A promise resolving to the session document, or null if not found.
   */
  async findBySessionId(sessaoId) {
    return await EyeTrackingSession.findOne({ sessao_id: sessaoId });
  }
}

module.exports = new EyeTrackingSessionRepository();
