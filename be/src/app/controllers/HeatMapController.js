const fs = require("fs");
const UploadFilesUseCase = require("../useCases/heatMapCases/UploadFileUseCase");
const ProcessCsvDataUseCase = require("../useCases/heatMapCases/ProcessCsvDataUseCase");
const SaveFileDataUseCase = require("../useCases/heatMapCases/SaveFileDataUseCase");
const FileRepository = require("../repositories/FileRepository");
const logger = require("../configs/logger");

class HeatMapController {
  async store(request, response) {
    try {
      const { csvFile, mediaFile } = await UploadFilesUseCase.execute(
        request,
        response
      );

      const { filename, description, mediaType } = request.body;

      if (!filename) {
        if (csvFile) fs.unlinkSync(csvFile.path);
        if (mediaFile) fs.unlinkSync(mediaFile.path);

        return response
          .status(400)
          .json({ error: "Nome do arquivo é obrigatório" });
      }

      const existingFile = await FileRepository.findByFilename(filename);
      if (existingFile) {
        if (csvFile) fs.unlinkSync(csvFile.path);
        if (mediaFile) fs.unlinkSync(mediaFile.path);

        return response
          .status(400)
          .json({ error: "Um arquivo com esse nome já existe" });
      }

      const results = await ProcessCsvDataUseCase.execute(csvFile.path);
      const processedData = ProcessCsvDataUseCase.processHeatmapData(results);

      const savedFile = await SaveFileDataUseCase.execute(
        {
          filename,
          description,
          path: csvFile.path,
          mediaPath: mediaFile?.path || null,
          mediaType: parseInt(mediaType) || 0,
        },
        processedData
      );

      fs.unlinkSync(csvFile.path);

      response.status(200).json({
        message: "Arquivos processados e dados salvos com sucesso!",
        data: savedFile,
      });
    } catch (error) {
      logger.error(
        "Erro ao processar os arquivos ou salvar no MongoDB: %s",
        error.message
      );

      if (request.files?.file?.path && fs.existsSync(request.files.file.path)) {
        fs.unlinkSync(request.files.file.path);
      }
      if (
        request.files?.mediaFile?.path &&
        fs.existsSync(request.files.mediaFile.path)
      ) {
        fs.unlinkSync(request.files.mediaFile.path);
      }

      response.status(500).json({
        error: "Erro ao processar os arquivos enviados",
        details: error.message,
      });
    }
  }

  // atualiza heatmap
  async update(request, response) {
    try {
      const { id } = request.params;
      const { filename, description } = request.body;
      const mediaFile = request.files?.mediaFile || null;
  
      const existingFile = await FileRepository.getFileById(id);
      if (!existingFile) {
        return response.status(404).json({ error: "Arquivo não encontrado" });
      }
  
      const updateData = {};
  
      if (filename) updateData.filename = filename;
      if (description) updateData.description = description;
  
      if (mediaFile) {
        if (existingFile.mediaPath && fs.existsSync(existingFile.mediaPath)) {
          fs.unlinkSync(existingFile.mediaPath);
        }
  
        updateData.mediaPath = mediaFile.path;
      }
  
      const updatedFile = await FileRepository.updateFile(id, updateData);
  
      response.status(200).json({
        message: "Arquivo atualizado com sucesso!",
        data: updatedFile,
      });
    } catch (error) {
      logger.error("Erro ao atualizar o arquivo: %s", error.message);
      response.status(500).json({
        error: "Erro ao atualizar o arquivo",
        details: error.message,
      });
    }
  }
  
}

module.exports = new HeatMapController();
