import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import {
  getExperimentById,
  getExperimentSessions,
} from "@/services/eyetrackingService";
import {
  transformToCoordinates,
  validateCoordinates,
  scaleCoordinates,
  calculateResponsiveScale,
  calculateCanvasSize,
} from "@/utils/heatmapUtils";

const estimateCaptureFps = (coords = []) => {
  if (!Array.isArray(coords) || coords.length < 2) return 0;

  const deltas = [];
  for (let index = 1; index < coords.length; index += 1) {
    const previousTimestamp = Number(coords[index - 1]?.timestamp);
    const currentTimestamp = Number(coords[index]?.timestamp);
    const delta = currentTimestamp - previousTimestamp;
    if (Number.isFinite(delta) && delta > 0) deltas.push(delta);
  }

  if (deltas.length === 0) return 0;

  deltas.sort((a, b) => a - b);
  const middle = Math.floor(deltas.length / 2);
  const medianDelta =
    deltas.length % 2 === 0
      ? (deltas[middle - 1] + deltas[middle]) / 2
      : deltas[middle];

  return medianDelta > 0 ? Math.round(1000 / medianDelta) : 0;
};

const getEntityId = (entity) =>
  entity?.id ||
  entity?.sampleId ||
  entity?.amostra_id ||
  entity?.pieceId ||
  entity?.peca_id;

const matchesSelectedId = (entity, selectedId) => {
  if (!selectedId) return false;
  return String(getEntityId(entity)) === String(selectedId);
};

const medianNumber = (values, fallback = 0) => {
  const filtered = values.filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  if (filtered.length === 0) return fallback;

  filtered.sort((a, b) => a - b);
  const middle = Math.floor(filtered.length / 2);
  return filtered.length % 2 === 0
    ? Math.round((filtered[middle - 1] + filtered[middle]) / 2)
    : filtered[middle];
};

export const useHeatmapData = (experimentId) => {
  const [loadState, dispatchLoad] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "START_LOAD":
          return { isLoading: true, error: null, experiment: null, sessions: [] };
        case "LOAD_SUCCESS":
          return {
            isLoading: false,
            error: null,
            experiment: action.payload.experiment,
            sessions: action.payload.sessions,
          };
        case "LOAD_FAILURE":
          return { isLoading: false, error: action.payload, experiment: null, sessions: [] };
        default:
          return state;
      }
    },
    { isLoading: true, error: null, experiment: null, sessions: [] }
  );

  const { isLoading, error, experiment, sessions } = loadState;

  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [selectedPieceId, setSelectedPieceId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("all");

  const activeSampleId = selectedSampleId || (experiment?.jsonData?.samples?.[0]?.id || "");

  const activePieceId = useMemo(() => {
    if (!experiment) return "";
    const isOldImported = Array.isArray(experiment.jsonData);
    if (isOldImported) {
      return "old-media";
    }
    const allPieces = experiment.jsonData?.pieces || [];
    if (selectedPieceId) {
      const piece = allPieces.find((p) => p.id === selectedPieceId);
      if (piece && piece.sampleId === activeSampleId) {
        return selectedPieceId;
      }
    }
    const piecesForSample = allPieces.filter((p) => p.sampleId === activeSampleId);
    return piecesForSample[0]?.id || allPieces[0]?.id || "";
  }, [selectedPieceId, experiment, activeSampleId]);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!experimentId) return;
    dispatchLoad({ type: "START_LOAD" });
    try {
      const expData = await getExperimentById(experimentId);

      const isOldImported = Array.isArray(expData.jsonData);
      let sessionsData = [];

      if (isOldImported) {
        sessionsData = expData.jsonData.map((item, idx) => ({
          sessao_id: `imported-${idx}`,
          participante: {
            nome: item.Nome || item.nome || `Importado ${idx + 1}`,
          },
          ...item,
        }));
      } else {
        const sessData = await getExperimentSessions(experimentId);
        sessionsData = sessData || [];
      }

      dispatchLoad({
        type: "LOAD_SUCCESS",
        payload: { experiment: expData, sessions: sessionsData },
      });

    } catch (err) {
      console.error(err);
      dispatchLoad({ type: "LOAD_FAILURE", payload: "Erro ao buscar dados do heatmap" });
    }
  }, [experimentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetSelectedSampleId = useCallback((sampleId) => {
    setSelectedSampleId(sampleId);
    setSelectedPieceId("");
  }, []);

  const derivedHeatmapData = useMemo(() => {
    if (!experiment || !activePieceId) {
      return {
        activePiece: null,
        coords: [],
        radiusScale: 1,
        canvasSize: { width: 1280, height: 720 },
        captureFps: 60,
        timelineDurationMs: 0,
      };
    }

    let piece = (experiment.jsonData?.pieces || []).find(
      (candidate) => candidate.id === activePieceId,
    );

    const isOldImported = Array.isArray(experiment.jsonData);
    if (isOldImported && activePieceId === "old-media") {
      piece = {
        id: "old-media",
        name: experiment.filename,
        mediaUrl: experiment.mediaPath?.replace("/app/uploads/media/", ""),
        previewKind: experiment.mediaType === 1 ? "video" : "image",
      };
    }

    if (!piece) {
      return {
        activePiece: null,
        coords: [],
        radiusScale: 1,
        canvasSize: { width: 1280, height: 720 },
        captureFps: 60,
        timelineDurationMs: 0,
      };
    }

    let combinedCoords = [];
    const captureFpsCandidates = [];
    let timelineOffset = 0;

    if (isOldImported) {
      const sessionsToUse =
        selectedSessionId === "all"
          ? sessions
          : sessions.filter(
              (session) => session.sessao_id === selectedSessionId,
            );

      sessionsToUse.forEach((session) => {
        if (session.coordinates && Array.isArray(session.coordinates)) {
          combinedCoords = combinedCoords.concat(session.coordinates);
        } else if (session.x && session.y) {
          combinedCoords = combinedCoords.concat(
            transformToCoordinates(session.x, session.y),
          );
        }
      });
    } else {
      const sessionsToUse =
        selectedSessionId === "all"
          ? sessions
          : sessions.filter(
              (session) => session.sessao_id === selectedSessionId,
            );

      sessionsToUse.forEach((session) => {
        const matchingSamples = (session.amostras || []).filter((amostra) => {
          if (!activeSampleId) return true;
          return matchesSelectedId(amostra, activeSampleId);
        });

        matchingSamples.forEach((amostra) => {
          const pieceData = (amostra.pecas || []).find((candidate) =>
            matchesSelectedId(candidate, activePieceId),
          );

          if (!pieceData || !pieceData.dados_eyetracking) return;

          const screenWidth =
            experiment.experiment?.basic?.screenWidth ||
            experiment.basic?.screenWidth ||
            1280;
          const screenHeight =
            experiment.experiment?.basic?.screenHeight ||
            experiment.basic?.screenHeight ||
            720;

          const mapped = pieceData.dados_eyetracking.map((coord, index) => {
            const fallbackTimestamp = index * (1000 / 60);
            const timestamp = Number(coord.timestamp);

            let finalX = coord.x;
            let finalY = coord.y;

            if (typeof coord.normalized_x === "number" && typeof coord.normalized_y === "number") {
              finalX = coord.normalized_x * screenWidth;
              finalY = coord.normalized_y * screenHeight;
            } else if (coord.x <= 1 && coord.y <= 1 && coord.x >= 0 && coord.y >= 0) {
              finalX = coord.x * screenWidth;
              finalY = coord.y * screenHeight;
            } else if (coord.screen_width && coord.screen_height) {
              finalX = (coord.x / coord.screen_width) * screenWidth;
              finalY = (coord.y / coord.screen_height) * screenHeight;
            }

            const scaledPoint = {
              ...coord,
              x: finalX,
              y: finalY,
            };

            return {
              ...scaledPoint,
              timestamp: Number.isFinite(timestamp)
                ? timestamp
                : fallbackTimestamp,
            };
          });

          const segmentDurationMs =
            Number(pieceData.exposure_seconds || pieceData.exposureSeconds) > 0
              ? Number(
                  pieceData.exposure_seconds || pieceData.exposureSeconds,
                ) * 1000
              : mapped[mapped.length - 1]?.timestamp || 0;

          const pieceCaptureFps =
            Number(pieceData.capture_fps || pieceData.captureFps) ||
            estimateCaptureFps(mapped);
          if (pieceCaptureFps > 0) captureFpsCandidates.push(pieceCaptureFps);

          combinedCoords = combinedCoords.concat(
            mapped.map((point) => ({
              ...point,
              timestamp: point.timestamp + timelineOffset,
            })),
          );
          timelineOffset += segmentDurationMs;
        });
      });
    }

    const validCoords = validateCoordinates(combinedCoords);
    console.log("Heatmap Coordinates parsed:", {
      raw: combinedCoords.length,
      valid: validCoords.length,
      sample: validCoords.slice(0, 5),
    });

    const estimatedCaptureFps =
      medianNumber(captureFpsCandidates) ||
      estimateCaptureFps(validCoords) ||
      60;

    const originalWidth =
      experiment.experiment?.basic?.screenWidth ||
      experiment.basic?.screenWidth ||
      1280;
    const originalHeight =
      experiment.experiment?.basic?.screenHeight ||
      experiment.basic?.screenHeight ||
      720;

    const scale = calculateResponsiveScale(
      originalWidth,
      originalHeight,
      windowSize,
    );
    const newCanvasSize = calculateCanvasSize(
      originalWidth,
      originalHeight,
      scale,
    );
    const scaledCoords = scaleCoordinates(validCoords, scale);

    return {
      activePiece: piece,
      coords: scaledCoords,
      radiusScale: scale,
      canvasSize: newCanvasSize,
      captureFps: estimatedCaptureFps,
      timelineDurationMs:
        timelineOffset || validCoords[validCoords.length - 1]?.timestamp || 0,
    };
  }, [
    experiment,
    sessions,
    activePieceId,
    activeSampleId,
    selectedSessionId,
    windowSize,
  ]);

  const {
    activePiece,
    coords,
    radiusScale,
    canvasSize,
    captureFps,
    timelineDurationMs,
  } = derivedHeatmapData;

  return {
    experiment,
    sessions,
    isLoading,
    error,
    activePiece,
    selectedSampleId: activeSampleId,
    setSelectedSampleId: handleSetSelectedSampleId,
    selectedPieceId: activePieceId,
    setSelectedPieceId,
    selectedSessionId,
    setSelectedSessionId,
    coords,
    radiusScale,
    canvasSize,
    captureFps,
    timelineDurationMs,
    windowSize,
  };
};
