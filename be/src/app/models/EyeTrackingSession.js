const mongoose = require("mongoose");

const trackingPointSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Number,
      required: true,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    frame: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const pieceSessionSchema = new mongoose.Schema(
  {
    peca_id: {
      type: String,
      required: true,
    },
    ordem_apresentacao: {
      type: Number,
      required: true,
    },
    dados_eyetracking: {
      type: [trackingPointSchema],
      default: [],
    },
  },
  { _id: false },
);

const sampleSessionSchema = new mongoose.Schema(
  {
    amostra_id: {
      type: String,
      required: true,
    },
    ordem_apresentacao: {
      type: Number,
      required: true,
    },
    pecas: {
      type: [pieceSessionSchema],
      default: [],
    },
  },
  { _id: false },
);

const eyeTrackingSessionSchema = new mongoose.Schema(
  {
    sessao_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    experimento_id: {
      type: String,
      required: true,
      index: true,
    },
    participante: {
      nome: {
        type: String,
        default: "",
      },
      cpf: {
        type: String,
        default: "",
      },
    },
    amostras: {
      type: [sampleSessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const EyeTrackingSession = mongoose.model(
  "EyeTrackingSession",
  eyeTrackingSessionSchema,
);

module.exports = EyeTrackingSession;
