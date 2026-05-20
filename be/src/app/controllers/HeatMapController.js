const StoreHeatMapUseCase = require("../useCases/heatMapCases/StoreHeatMapUseCase");
const UpdateHeatMapUseCase = require("../useCases/heatMapCases/UpdateHeatMapUseCase");
const logger = require("../configs/logger");

/**
 * Controller responsible for managing HeatMap operations.
 */
class HeatMapController {
  /**
   * Stores a new HeatMap experiment.
   * @param {Object} request - The HTTP request object containing files and body data.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with success or error message.
   */
  async store(request, response) {
    try {
      const savedFile = await StoreHeatMapUseCase.execute(request, response);

      return response.status(200).json({
        message: "Arquivos processados e dados salvos com sucesso!",
        data: savedFile,
      });
    } catch (error) {
      if (error.status) {
        return response.status(error.status).json({ error: error.message });
      }

      logger.error(
        "Erro ao processar os arquivos ou salvar no MongoDB: %s",
        error.message
      );

      return response.status(500).json({
        error: "Erro ao processar os arquivos enviados",
        details: error.message,
      });
    }
  }

  /**
   * Updates an existing HeatMap experiment.
   * @param {Object} request - The HTTP request object containing parameters and body data.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The HTTP response with success or error message.
   */
  async update(request, response) {
    try {
      const { id } = request.params;
      const { filename, description } = request.body;
      const mediaFile = request.files?.mediaFile || null;
  
      const updatedFile = await UpdateHeatMapUseCase.execute(id, { filename, description }, mediaFile);
  
      return response.status(200).json({
        message: "Arquivo atualizado com sucesso!",
        data: updatedFile,
      });
    } catch (error) {
      if (error.status === 404) {
        return response.status(404).json({ error: error.message });
      }

      logger.error("Erro ao atualizar o arquivo: %s", error.message);
      return response.status(500).json({
        error: "Erro ao atualizar o arquivo",
        details: error.message,
      });
    }
  }
}

module.exports = new HeatMapController();
