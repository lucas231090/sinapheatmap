const isValidId = require("../utils/isValidId");
const CreateEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/CreateEyeTrackingExperimentUseCase");
const GetAllFilesUseCase = require("../useCases/eyeTrackingCases/GetAllFilesUseCase");
const GetFileByIdUseCase = require("../useCases/eyeTrackingCases/GetFileByIdUseCase");
const GetPublicEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/GetPublicEyeTrackingExperimentUseCase");
const UpdateEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/UpdateEyeTrackingExperimentUseCase");
const UpdateFileStatusUseCase = require("../useCases/eyeTrackingCases/UpdateFileStatusUseCase");
const CreateEyeTrackingSessionUseCase = require("../useCases/eyeTrackingCases/CreateEyeTrackingSessionUseCase");
const logger = require("../configs/logger");

/**
 * Controller responsible for managing EyeTracking operations.
 */
class EyeTrackingController {
  /**
   * Stores a new Eye Tracking experiment.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with success or error message.
   */
  async store(request, response) {
    try {
      const createdExperiment = await CreateEyeTrackingExperimentUseCase.execute(
        request.body,
        request.userId || null
      );

      logger.info("Experimento de eyetracking criado: %s", request.body.name);

      return response.status(201).json({
        message: "Experimento criado com sucesso",
        data: createdExperiment,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return response
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }

      if (error.status) {
        return response.status(error.status).json({ error: error.message, details: error.details });
      }

      if (error.code === "EXPERIMENT_ALREADY_EXISTS") {
        return response.status(409).json({ error: error.message });
      }

      logger.error("Erro ao criar experimento: %s", error.message);
      return response.status(500).json({ error: "Erro ao criar experimento" });
    }
  }

  /**
   * Retrieves all Eye Tracking files.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with the list of experiments.
   */
  async index(request, response) {
    try {
      const experiment = await GetAllFilesUseCase.execute();
      logger.info("Listagem de todos os testes cadastrados");
      return response.status(200).json(experiment);
    } catch (error) {
      logger.error("Erro ao buscar arquivos: %s", error.message);
      return response.status(500).json({ error: "Erro ao buscar arquivos" });
    }
  }

  /**
   * Retrieves a specific Eye Tracking experiment by ID.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with the experiment data.
   */
  async show(request, response) {
    const { _id } = request.params;

    if (!isValidId(_id)) {
      logger.warn("ID inválido: %s", _id);
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      const user = await GetFileByIdUseCase.execute(_id);

      if (!user) {
        logger.warn("Teste não encontrado para o ID: %s", _id);
        return response.status(404).json({ error: "Teste não encontrado" });
      }

      logger.info("Teste encontrado para o ID: %s", _id);
      return response.status(200).json(user);
    } catch (error) {
      logger.error("Erro ao buscar o arquivo: %s", error.message);
      return response.status(500).json({ error: "Erro ao buscar o arquivo" });
    }
  }

  /**
   * Retrieves a specific Eye Tracking experiment by ID for public access.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with the public experiment data.
   */
  async publicShow(request, response) {
    const { _id } = request.params;

    if (!isValidId(_id)) {
      logger.warn("ID inválido para acesso público: %s", _id);
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      const experiment = await GetPublicEyeTrackingExperimentUseCase.execute(_id);

      if (!experiment) {
        logger.warn("Teste indisponível no momento: %s", _id);
        return response
          .status(403)
          .json({ error: "Teste indisponível no momento" });
      }

      logger.info("Teste público encontrado para o ID: %s", _id);
      return response.status(200).json(experiment);
    } catch (error) {
      logger.error("Erro ao buscar teste público: %s", error.message);
      return response.status(500).json({ error: "Erro ao buscar o teste" });
    }
  }

  /**
   * Stores a new session for an Eye Tracking experiment.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with success or error message.
   */
  async storeSession(request, response) {
    try {
      const savedSession = await CreateEyeTrackingSessionUseCase.execute(request.body);

      logger.info("Sessão de eyetracking salva: %s", request.body.sessao_id);

      return response.status(201).json({
        message: "Sessão salva com sucesso",
        data: savedSession,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return response
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }

      logger.error("Erro ao salvar sessão: %s", error.message);
      return response.status(500).json({ error: "Erro ao salvar a sessão" });
    }
  }

  /**
   * Updates an existing Eye Tracking experiment or its active status.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with success or error message.
   */
  async updateActiveStatus(request, response) {
    const { _id } = request.params;
    const { active } = request.body;
    const hasExperimentData = Boolean(
      request.body?.experiment ||
      request.body?.name ||
      request.body?.description,
    );

    if (!isValidId(_id)) {
      logger.warn("ID inválido: %s", _id);
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      if (!hasExperimentData && typeof active === "boolean") {
        const updatedFile = await UpdateFileStatusUseCase.execute(_id, active);

        if (!updatedFile) {
          logger.warn("Teste não encontrado para o ID: %s", _id);
          return response.status(404).json({ error: "Teste não encontrado" });
        }

        logger.info("Status do teste atualizado para o ID: %s", _id);
        return response.status(200).json(updatedFile);
      }

      const updatedExperiment = await UpdateEyeTrackingExperimentUseCase.execute(
        _id,
        request.body,
        request.userId || null
      );

      if (!updatedExperiment) {
        logger.warn("Teste não encontrado para o ID: %s", _id);
        return response.status(404).json({ error: "Teste não encontrado" });
      }

      logger.info("Experimento atualizado para o ID: %s", _id);
      return response.status(200).json({
        message: "Experimento atualizado com sucesso",
        data: updatedExperiment,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return response
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }

      if (error.status) {
        return response.status(error.status).json({ error: error.message, details: error.details });
      }

      if (error.code === "EXPERIMENT_ALREADY_EXISTS") {
        return response.status(409).json({ error: error.message });
      }

      logger.error("Erro ao atualizar o experimento: %s", error.message);
      return response.status(500).json({ error: "Erro ao atualizar o experimento" });
    }
  }
}

module.exports = new EyeTrackingController();
