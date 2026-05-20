const isValidId = require("../utils/isValidId");
const { ZodError, z } = require("zod");
const CreateEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/CreateEyeTrackingExperimentUseCase");
const GetAllFilesUseCase = require("../useCases/eyeTrackingCases/GetAllFilesUseCase");
const GetFileByIdUseCase = require("../useCases/eyeTrackingCases/GetFileByIdUseCase");
const GetPublicEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/GetPublicEyeTrackingExperimentUseCase");
const UpdateEyeTrackingExperimentUseCase = require("../useCases/eyeTrackingCases/UpdateEyeTrackingExperimentUseCase");
const UpdateFileStatusUseCase = require("../useCases/eyeTrackingCases/UpdateFileStatusUseCase");
const CreateEyeTrackingSessionUseCase = require("../useCases/eyeTrackingCases/CreateEyeTrackingSessionUseCase");
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

const eyeTrackingSessionSchema = z.object({
  sessao_id: z.string().trim().min(1),
  experimento_id: z.string().trim().min(1),
  participante: z
    .object({
      nome: z.string().trim().default(""),
      cpf: z.string().trim().default(""),
    })
    .passthrough(),
  amostras: z
    .array(
      z.object({
        amostra_id: z.string().trim().min(1),
        ordem_apresentacao: z.coerce.number().int().positive(),
        pecas: z.array(
          z.object({
            peca_id: z.string().trim().min(1),
            ordem_apresentacao: z.coerce.number().int().positive(),
            dados_eyetracking: z
              .array(
                z.object({
                  timestamp: z.coerce.number(),
                  x: z.coerce.number(),
                  y: z.coerce.number(),
                  frame: z.coerce.number(),
                }),
              )
              .default([]),
          }),
        ),
      }),
    )
    .default([]),
});

function getExperimentValidationError(payload) {
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
    return {
      status: 400,
      body: {
        error: "Cada amostra precisa ter pelo menos uma peça.",
        details: samplesWithoutPieces.map((sample) => sample.id),
      },
    };
  }

  const invalidPieces = payload.experiment.pieces.filter(
    (piece) => !sampleIds.has(piece.sampleId),
  );

  if (invalidPieces.length) {
    return {
      status: 400,
      body: { error: "Existe peça vinculada a uma amostra inexistente." },
    };
  }

  return null;
}

class EyeTrackingController {
  async store(request, response) {
    try {
      const payload = createExperimentSchema.parse(request.body);
      const validationError = getExperimentValidationError(payload);

      if (validationError) {
        return response
          .status(validationError.status)
          .json(validationError.body);
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

  async publicShow(request, response) {
    const { _id } = request.params;

    if (!isValidId(_id)) {
      logger.warn("ID inválido para acesso público: %s", _id);
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      const experiment =
        await GetPublicEyeTrackingExperimentUseCase.execute(_id);

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

  async storeSession(request, response) {
    try {
      const payload = eyeTrackingSessionSchema.parse(request.body);
      const savedSession =
        await CreateEyeTrackingSessionUseCase.execute(payload);

      logger.info("Sessão de eyetracking salva: %s", payload.sessao_id);

      return response.status(201).json({
        message: "Sessão salva com sucesso",
        data: savedSession,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return response
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }

      logger.error("Erro ao salvar sessão: %s", error.message);
      return response.status(500).json({ error: "Erro ao salvar a sessão" });
    }
  }

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

      const payload = createExperimentSchema.parse(request.body);
      const validationError = getExperimentValidationError(payload);

      if (validationError) {
        return response
          .status(validationError.status)
          .json(validationError.body);
      }

      const updatedExperiment =
        await UpdateEyeTrackingExperimentUseCase.execute({
          id: _id,
          filename: payload.name,
          description: payload.description,
          experimentData: {
            ...payload.experiment,
            updatedAt: new Date().toISOString(),
            updatedBy: request.userId || null,
          },
        });

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
      if (error instanceof ZodError) {
        return response
          .status(400)
          .json({ error: "Dados inválidos", details: error.issues });
      }

      if (error.code === "EXPERIMENT_ALREADY_EXISTS") {
        return response.status(409).json({ error: error.message });
      }

      logger.error("Erro ao atualizar o experimento: %s", error.message);
      response.status(500).json({ error: "Erro ao atualizar o experimento" });
    }
  }
}

module.exports = new EyeTrackingController();
