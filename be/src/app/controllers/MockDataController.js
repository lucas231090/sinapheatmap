const data = require("../../../public/mocks/dataHeatmap");

class HeatmapDataController {
  async getData(request, response) {
    try {
      return response.status(200).json(data);
    } catch (error) {
      return response.status(500).json({
        error: "Erro ao obter os dados do heatmap",
        details: error.message,
      });
    }
  }
}

module.exports = new HeatmapDataController();
