const StoreHeatMapUseCase = require("../useCases/heatMapCases/StoreHeatMapUseCase");
const UpdateHeatMapUseCase = require("../useCases/heatMapCases/UpdateHeatMapUseCase");
const logger = require("../configs/logger");

/**
 * Controller responsible for managing HeatMap operations.
 * Handles storing and updating HeatMap experiments, including the
 * associated media files and configurations.
 */
class HeatMapController {
  /**
   * Stores a new HeatMap experiment.
   * Delegates the processing of uploaded files and data storage to StoreHeatMapUseCase.
   *
   * @param {Object} request - The Express HTTP request object containing files and body data.
   * @param {Object} response - The Express HTTP response object.
   * @returns {Promise<Object>} The HTTP response with status 200 on success, or 500 on error.
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
   * Allows updating the filename, description, and potentially replacing the media file.
   * Delegates to UpdateHeatMapUseCase.
   *
   * @param {Object} request - The Express HTTP request object containing `id` in params, and `filename`, `description`, `mediaFile` in body/files.
   * @param {Object} response - The Express HTTP response object.
   * @returns {Promise<Object>} The HTTP response with status 200 on success, or 404/500 on error.
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
