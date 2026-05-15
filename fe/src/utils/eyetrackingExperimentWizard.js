export function createId() {
  return crypto.randomUUID();
}

export function createEmptyBasicData() {
  return {
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    showDescriptionOnTest: true,
    allowMultipleSessions: false,
  };
}

export function createEmptyIdentificationData() {
  return {
    required: true,
    mode: "nome",
  };
}

export function createEmptyOrganizationData() {
  return {
    randomizeSamples: false,
    randomizePieces: false,
  };
}

export function createEmptyParticipant() {
  return {
    id: createId(),
    name: "",
    cpf: "",
  };
}

export function createEmptySample() {
  return {
    id: createId(),
    name: "",
    description: "",
  };
}

export function createEmptyPiece(sampleId = "") {
  return {
    id: createId(),
    sampleId,
    sourceType: "file",
    sourceLabel: "",
    sourceUrl: "",
    fileName: "",
    mimeType: "",
    exposureSeconds: "10",
    previewKind: "image",
  };
}

export function createEmptyExperimentState() {
  return {
    basic: createEmptyBasicData(),
    identification: createEmptyIdentificationData(),
    organization: createEmptyOrganizationData(),
    participants: [],
    samples: [],
    pieces: [],
  };
}

export function createEmptySampleDraft() {
  return createEmptySample();
}

export function createEmptyPieceDraft(sampleId = "") {
  return createEmptyPiece(sampleId);
}

export function moveItem(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) {
    return list;
  }

  const nextList = [...list];
  const [movedItem] = nextList.splice(fromIndex, 1);
  nextList.splice(toIndex, 0, movedItem);
  return nextList;
}

export function parseParticipantRows(text) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/;+$/g, "").trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (!parts[0]) {
        return null;
      }

      return {
        id: createId(),
        name: parts[0] || "",
        cpf: parts[1] || "",
      };
    })
    .filter(Boolean);
}

export function sampleHasPieces(sampleId, pieces) {
  return pieces.some((piece) => piece.sampleId === sampleId);
}

export function canAdvanceFromAssets(samples, pieces) {
  return (
    samples.length > 0 &&
    samples.every((sample) => sampleHasPieces(sample.id, pieces))
  );
}

export function reorderPiecesWithinSample(
  pieces,
  sampleId,
  fromIndex,
  toIndex,
) {
  const samplePieces = pieces.filter((piece) => piece.sampleId === sampleId);
  const reorderedSamplePieces = moveItem(samplePieces, fromIndex, toIndex);

  const nextPieces = [];
  let samplePieceIndex = 0;

  pieces.forEach((piece) => {
    if (piece.sampleId === sampleId) {
      nextPieces.push(reorderedSamplePieces[samplePieceIndex]);
      samplePieceIndex += 1;
      return;
    }

    nextPieces.push(piece);
  });

  return nextPieces;
}

export function isVideoSource({
  mimeType = "",
  sourceUrl = "",
  fileName = "",
}) {
  const source = `${mimeType} ${sourceUrl} ${fileName}`.toLowerCase();
  return /video|\.(mp4|webm|mov|avi)$/i.test(source);
}

export function buildExperimentPayload(experiment) {
  const serializablePieces = experiment.pieces.map((piece) => ({ ...piece }));

  return {
    name: experiment.basic.name.trim(),
    description: experiment.basic.description.trim(),
    experiment: {
      basic: {
        ...experiment.basic,
        name: experiment.basic.name.trim(),
        description: experiment.basic.description.trim(),
      },
      identification: experiment.identification,
      participants: experiment.participants,
      samples: experiment.samples,
      pieces: serializablePieces,
      organization: {
        ...experiment.organization,
        sampleOrder: experiment.samples.map((sample) => sample.id),
        pieceOrderBySample: experiment.samples.reduce((accumulator, sample) => {
          accumulator[sample.id] = serializablePieces
            .filter((piece) => piece.sampleId === sample.id)
            .map((piece) => piece.id);
          return accumulator;
        }, {}),
      },
      createdAt: new Date().toISOString(),
    },
  };
}
