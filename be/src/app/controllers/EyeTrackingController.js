const isValidId = require("../utils/isValidId");
const GetAllActiveFilesUseCase = require("../useCases/eyeTrackingCases/GetAllActiveFilesUseCase");
const GetFileByIdUseCase = require("../useCases/eyeTrackingCases/GetFileByIdUseCase");
const UpdateFileStatusUseCase = require("../useCases/eyeTrackingCases/UpdateFileStatusUseCase");
const logger = require("../configs/logger");

class EyeTrackingController {
  async index(request, response) {
    try {
      const experiment = await GetAllActiveFilesUseCase.execute();
      logger.info("Listagem de todos os arquivos ativos");
      response.status(200).json(experiment);
    } catch (error) {
      logger.error("Erro ao buscar arquivos: %s", error.message);
      response.status(500).json({ error: "Erro ao buscar arquivos" });
    }
  }

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
      response.status(500).json({ error: "Erro ao buscar o arquivo" });
    }
  }

  async updateActiveStatus(request, response) {
    const { _id } = request.params;
    const { active } = request.body;

    if (!isValidId(_id)) {
      logger.warn("ID inválido: %s", _id);
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      const updatedFile = await UpdateFileStatusUseCase.execute(_id, active);

      if (!updatedFile) {
        logger.warn("Teste não encontrado para o ID: %s", _id);
        return response.status(404).json({ error: "Teste não encontrado" });
      }

      logger.info("Status do teste atualizado para o ID: %s", _id);
      return response.status(200).json(updatedFile);
    } catch (error) {
      logger.error("Erro ao atualizar o status do arquivo: %s", error.message);
      response
        .status(500)
        .json({ error: "Erro ao atualizar o status do arquivo" });
    }
  }
}

module.exports = new EyeTrackingController();
