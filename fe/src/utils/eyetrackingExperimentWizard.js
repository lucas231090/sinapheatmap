
function createId() {
  return crypto.randomUUID();
}

function createEmptyBasicData() {
  return {
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    showDescriptionOnTest: true,
    allowMultipleSessions: false,
  };
}


function createEmptyOrganizationData() {
  return {
    randomizeSamples: false,
    randomizePieces: false,
  };
}


function createEmptySample() {
  return {
    id: createId(),
    name: "",
    description: "",
  };
}

function createEmptyPiece(sampleId = "") {
  return {
    id: createId(),
    sampleId,
    sourceType: "file",
    sourceLabel: "",
    sourceUrl: "",
    fileName: "",
    mimeType: "",
    previewUrl: "",
    mediaPath: "",
    exposureSeconds: "10",
    previewKind: "image",
    imageDisplayMode: "original",
  };
}

export function createEmptyExperimentState() {
  return {
    basic: createEmptyBasicData(),
    organization: createEmptyOrganizationData(),
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


function sampleHasPieces(sampleId, pieces) {
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


export function normalizeExperimentRecord(record) {
  const rawExperiment =
    record?.jsonData ||
    record?.experiment ||
    record?.data?.experiment ||
    record?.experimentData ||
    {};
  const baseState = createEmptyExperimentState();
  const normalizedSamples = Array.isArray(rawExperiment.samples)
    ? rawExperiment.samples
    : [];
  const normalizedPieces = Array.isArray(rawExperiment.pieces)
    ? rawExperiment.pieces
    : [];

  const experiment = {
    basic: {
      ...baseState.basic,
      ...(rawExperiment.basic || {}),
      name:
        rawExperiment?.basic?.name || record?.filename || baseState.basic.name,
      description:
        rawExperiment?.basic?.description ||
        record?.description ||
        baseState.basic.description,
      isImported:
        rawExperiment?.basic?.isImported || Array.isArray(record?.jsonData),
      recordId: record?._id || record?.id,
    },
    organization: {
      ...baseState.organization,
      ...(rawExperiment.organization || {}),
    },
    samples: normalizedSamples.map((sample) => ({
      id: sample?.id || createId(),
      name: sample?.name || "",
      description: sample?.description || "",
    })),
    pieces: normalizedPieces.map((piece) => ({
      id: piece?.id || createId(),
      sampleId: piece?.sampleId || "",
      sourceType: piece?.sourceType || "file",
      sourceLabel: piece?.sourceLabel || piece?.fileName || "",
      sourceUrl: piece?.sourceUrl || "",
      fileName: piece?.fileName || "",
      mimeType: piece?.mimeType || "",
      previewUrl: piece?.previewUrl || "",
      mediaPath: piece?.mediaPath || "",
      exposureSeconds: String(piece?.exposureSeconds || "10"),
      previewKind:
        piece?.previewKind || (isVideoSource(piece || {}) ? "video" : "image"),
      imageDisplayMode: piece?.imageDisplayMode || "original",
    })),
  };

  return {
    experiment,
    createdAt: rawExperiment?.createdAt || record?.createdAt || "",
  };
}

export function buildExperimentPayload(experiment, options = {}) {
  const serializablePieces = experiment.pieces.map((piece) => ({
    ...piece,
    previewUrl:
      piece.previewUrl &&
      !piece.previewUrl.startsWith("data:") &&
      !piece.previewUrl.startsWith("blob:")
        ? piece.previewUrl
        : "",
  }));
  const createdAt = options.createdAt || new Date().toISOString();

  return {
    name: experiment.basic.name.trim(),
    description: experiment.basic.description.trim(),
    experiment: {
      basic: {
        ...experiment.basic,
        name: experiment.basic.name.trim(),
        description: experiment.basic.description.trim(),
      },
      samples: experiment.samples,
      pieces: serializablePieces,
      organization: {
        ...experiment.organization,
        sampleOrder: experiment.samples.map((sample) => sample.id),
        pieceOrderBySample: experiment.samples.reduce((accumulator, sample) => {
          const pieceIds = [];
          for (const piece of serializablePieces) {
            if (piece.sampleId === sample.id) {
              pieceIds.push(piece.id);
            }
          }
          accumulator[sample.id] = pieceIds;
          return accumulator;
        }, {}),
      },
      createdAt,
    },
  };
}
