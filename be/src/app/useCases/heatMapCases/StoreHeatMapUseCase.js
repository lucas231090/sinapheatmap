const fs = require("fs");
const path = require("path");
const UploadFilesUseCase = require("./UploadFileUseCase");
const ProcessCsvDataUseCase = require("./ProcessCsvDataUseCase");
const SaveFileDataUseCase = require("./SaveFileDataUseCase");
const FileRepository = require("../../repositories/FileRepository");

/**
 * UseCase to handle the logic of storing a heatmap, including file validation, processing, and cleanup.
 */
class StoreHeatMapUseCase {
  /**
   * Executes the use case.
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<Object>} The saved file data.
   * @throws {Error} If validation, processing, or saving fails.
   */
  async execute(request, response) {
    const { csvFile, mediaFile } = await UploadFilesUseCase.execute(
      request,
      response
    );

    const { filename, description } = request.body;

    if (!filename) {
      if (csvFile) fs.unlinkSync(csvFile.path);
      if (mediaFile) fs.unlinkSync(mediaFile.path);
      const error = new Error("Nome do arquivo é obrigatório");
      error.status = 400;
      throw error;
    }

    const existingFile = await FileRepository.findByFilename(filename);
    if (existingFile) {
      if (csvFile) fs.unlinkSync(csvFile.path);
      if (mediaFile) fs.unlinkSync(mediaFile.path);
      const error = new Error("Um arquivo com esse nome já existe");
      error.status = 400;
      throw error;
    }

    try {
      const results = await ProcessCsvDataUseCase.execute(csvFile.path);
      const { sessions: processedData, screenWidth, screenHeight } = ProcessCsvDataUseCase.processHeatmapData(results);

      const sampleId = "amostra-importada-1";
      const pieceId = "peca-importada-1";

      const normalizedJsonData = {
        basic: {
          name: filename,
          description: description || "",
          isImported: true,
          screenWidth: screenWidth,
          screenHeight: screenHeight,
        },
        identification: {
          required: false,
          mode: "nome",
        },
        samples: [
          {
            id: sampleId,
            name: "Amostra Importada",
            description: "Gerada automaticamente na importação",
          },
        ],
        pieces: [
          {
            id: pieceId,
            sampleId: sampleId,
            sourceType: "file",
            sourceLabel: mediaFile ? mediaFile.filename : "Mídia Importada",
            sourceUrl: mediaFile ? `/app/uploads/media/${path.basename(mediaFile.path)}` : "", // This won't work perfectly until saved, but SaveFileDataUseCase handles mediaPath rename! Let's pass the raw piece and it will be there.
            exposureSeconds: "0",
            previewKind: mediaFile && mediaFile.detectedMediaType === 1 ? "video" : "image",
          },
        ],
        participants: [],
        organization: {
          randomizeSamples: false,
          randomizePieces: false,
          sampleOrder: [sampleId],
          pieceOrderBySample: {
            [sampleId]: [pieceId],
          },
        },
        createdAt: new Date().toISOString(),
      };

      // Save file data first
      const savedFile = await SaveFileDataUseCase.execute(
        {
          filename,
          description,
          path: csvFile.path,
          mediaPath: mediaFile?.path || null,
          mediaType: mediaFile?.detectedMediaType || 0,
        },
        normalizedJsonData
      );

      // Now create sessions
      const CreateEyeTrackingSessionUseCase = require("../eyeTrackingCases/CreateEyeTrackingSessionUseCase");

      for (let i = 0; i < processedData.length; i++) {
        const sessionRow = processedData[i];
        
        // Build eyetracking data
        const dados_eyetracking = (sessionRow.coordinates || []).map((coord, idx) => ({
          timestamp: idx * 33, // dummy timestamp
          x: coord.x,
          y: coord.y,
          frame: idx,
        }));

        const sessionPayload = {
          sessao_id: `imported-${savedFile._id}-${i}`,
          experimento_id: savedFile._id.toString(),
          participante: {
            nome: sessionRow.Nome || sessionRow.nome || `Participante ${i + 1}`,
            cpf: "",
          },
          amostras: [
            {
              amostra_id: sampleId,
              ordem_apresentacao: 1,
              pecas: [
                {
                  peca_id: pieceId,
                  ordem_apresentacao: 1,
                  dados_eyetracking,
                },
              ],
            },
          ],
        };

        await CreateEyeTrackingSessionUseCase.execute(sessionPayload);
      }

      fs.unlinkSync(csvFile.path);
      return savedFile;
    } catch (error) {
      if (csvFile && fs.existsSync(csvFile.path)) {
        fs.unlinkSync(csvFile.path);
      }
      if (mediaFile && fs.existsSync(mediaFile.path)) {
        fs.unlinkSync(mediaFile.path);
      }
      throw error;
    }
  }
}

module.exports = new StoreHeatMapUseCase();
