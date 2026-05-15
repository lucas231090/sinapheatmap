const isValidId = require("../utils/isValidId");
const { ZodError, z } = require("zod");
const CreateEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/CreateEyeTrackingExperimentUseCase");
const GetAllFilesUseCase = require("../useCases/eyeTrackingCases/GetAllFilesUseCase");
const GetFileByIdUseCase = require("../useCases/eyeTrackingCases/GetFileByIdUseCase");
const UpdateFileStatusUseCase = require("../useCases/eyeTrackingCases/UpdateFileStatusUseCase");
const logger = require("../configs/logger");

const participantSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim(),
    cpf: z.string().trim().optional().default(""),
  })
  .passthrough();

const sampleSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().trim().optional().default(""),
  })
  .passthrough();

const pieceSchema = z
  .object({
    id: z.string().trim().min(1),
    sampleId: z.string().trim().min(1),
    sourceType: z.enum(["file", "url"]),
    sourceLabel: z.string().trim().min(1),
    sourceUrl: z.string().trim().optional().default(""),
    fileName: z.string().trim().optional().default(""),
    mimeType: z.string().trim().optional().default(""),
    exposureSeconds: z
      .union([z.string(), z.number()])
      .transform((value) => String(value)),
    previewKind: z.enum(["image", "video"]).default("image"),
  })
  .passthrough();

const createExperimentSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  description: z.string().trim().optional().default(""),
  experiment: z
    .object({
      basic: z
        .object({
          name: z.string().trim().min(1, "Nome obrigatório"),
          startDate: z.string().trim().optional().default(""),
          endDate: z.string().trim().optional().default(""),
          description: z.string().trim().optional().default(""),
          showDescriptionOnTest: z.boolean().default(true),
          allowMultipleSessions: z.boolean().default(false),
        })
        .passthrough(),
      identification: z
        .object({
          required: z.boolean().default(true),
          mode: z.enum(["nome", "cpf", "nome-cpf"]),
        })
        .passthrough(),
      participants: z.array(participantSchema).default([]),
      samples: z
        .array(sampleSchema)
        .min(1, "Pelo menos uma amostra é obrigatória"),
      pieces: z.array(pieceSchema).min(1, "Pelo menos uma peça é obrigatória"),
      organization: z
        .object({
          randomizeSamples: z.boolean().default(false),
          randomizePieces: z.boolean().default(false),
          sampleOrder: z.array(z.string()).default([]),
          pieceOrderBySample: z.record(z.array(z.string())).default({}),
        })
        .passthrough(),
      createdAt: z.string().optional(),
    })
    .passthrough(),
});

class EyeTrackingController {
  async store(request, response) {
    try {
      const payload = createExperimentSchema.parse(request.body);

      const sampleIds = new Set(
        payload.experiment.samples.map((sample) => sample.id),
      );
      const piecesBySample = payload.experiment.pieces.reduce(
        (accumulator, piece) => {
          if (!accumulator[piece.sampleId]) {
            accumulator[piece.sampleId] = [];
          }

          accumulator[piece.sampleId].push(piece);
          return accumulator;
        },
        {},
      );

      const samplesWithoutPieces = payload.experiment.samples.filter(
        (sample) => !piecesBySample[sample.id]?.length,
      );

      if (samplesWithoutPieces.length) {
        return response.status(400).json({
          error: "Cada amostra precisa ter pelo menos uma peça.",
          details: samplesWithoutPieces.map((sample) => sample.id),
        });
      }

      const invalidPieces = payload.experiment.pieces.filter(
        (piece) => !sampleIds.has(piece.sampleId),
      );

      if (invalidPieces.length) {
        return response.status(400).json({
          error: "Existe peça vinculada a uma amostra inexistente.",
        });
      }

      const createdExperiment =
        await CreateEyeTrackingExperimentUseCase.execute({
          filename: payload.name,
          description: payload.description,
          experimentData: {
            ...payload.experiment,
            createdAt: new Date().toISOString(),
            createdBy: request.userId || null,
          },
          createdBy: request.userId || null,
        });

      logger.info("Experimento de eyetracking criado: %s", payload.name);

      return response.status(201).json({
        message: "Experimento criado com sucesso",
        data: createdExperiment,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return response
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }

      if (error.code === "EXPERIMENT_ALREADY_EXISTS") {
        return response.status(409).json({ error: error.message });
      }

      logger.error("Erro ao criar experimento: %s", error.message);
      return response.status(500).json({ error: "Erro ao criar experimento" });
    }
  }

  async index(request, response) {
    try {
      const experiment = await GetAllFilesUseCase.execute();
      logger.info("Listagem de todos os testes cadastrados");
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
