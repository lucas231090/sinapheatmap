const { z } = require("zod");

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
    imageDisplayMode: z.enum(["original", "cover"]).default("original"),
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
          isImported: z.boolean().default(false),
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
                  normalized_x: z.coerce.number().optional(),
                  normalized_y: z.coerce.number().optional(),
                  screen_width: z.coerce.number().optional(),
                  screen_height: z.coerce.number().optional(),
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

module.exports = {
  createExperimentSchema,
  eyeTrackingSessionSchema,
  getExperimentValidationError,
};
