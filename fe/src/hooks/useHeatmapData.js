import { useState, useEffect, useCallback } from "react";
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
  const [experiment, setExperiment] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [selectedPieceId, setSelectedPieceId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("all");

  const [coords, setCoords] = useState([]);
  const [radiusScale, setRadiusScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [captureFps, setCaptureFps] = useState(60);
  const [timelineDurationMs, setTimelineDurationMs] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [activePiece, setActivePiece] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const expData = await getExperimentById(experimentId);
      setExperiment(expData);

      const isOldImported = Array.isArray(expData.jsonData);

      if (isOldImported) {
        const mappedSessions = expData.jsonData.map((item, idx) => ({
          sessao_id: `imported-${idx}`,
          participante: {
            nome: item.Nome || item.nome || `Importado ${idx + 1}`,
          },
          ...item,
        }));
        setSessions(mappedSessions);
      } else {
        const sessData = await getExperimentSessions(experimentId);
        setSessions(sessData || []);
      }

      const allSamples = expData.jsonData?.samples || [];
      if (!isOldImported && allSamples.length > 0) {
        setSelectedSampleId(allSamples[0].id);
      }

      let allPieces = expData.jsonData?.pieces || [];
      if (isOldImported) {
        allPieces = [
          {
            id: "old-media",
            name: expData.filename,
            mediaUrl: expData.mediaPath?.replace("/app/uploads/media/", ""),
            previewKind: expData.mediaType === 1 ? "video" : "image",
          },
        ];
      }

      if (allPieces.length > 0) {
        const piecesForSample =
          allSamples.length > 0
            ? allPieces.filter((piece) => piece.sampleId === allSamples[0].id)
            : allPieces;

        if (piecesForSample.length > 0) {
          setSelectedPieceId(piecesForSample[0].id);
        } else {
          setSelectedPieceId(allPieces[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar dados do heatmap");
    } finally {
      setIsLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    if (experimentId) {
      fetchData();
    }
  }, [experimentId, fetchData]);

  useEffect(() => {
    if (!experiment) return;

    const isOldImported = Array.isArray(experiment.jsonData);
    if (isOldImported) return;

    const allPieces = experiment.jsonData?.pieces || [];
    const piecesForSample = allPieces.filter(
      (piece) => piece.sampleId === selectedSampleId,
    );

    if (
      piecesForSample.length > 0 &&
      !piecesForSample.find((piece) => piece.id === selectedPieceId)
    ) {
      setSelectedPieceId(piecesForSample[0].id);
    }
  }, [selectedSampleId, selectedPieceId, experiment]);

  useEffect(() => {
    if (!experiment || !selectedPieceId) return;

    let piece = (experiment.jsonData?.pieces || []).find(
      (candidate) => candidate.id === selectedPieceId,
    );

    const isOldImported = Array.isArray(experiment.jsonData);
    if (isOldImported && selectedPieceId === "old-media") {
      piece = {
        id: "old-media",
        name: experiment.filename,
        mediaUrl: experiment.mediaPath?.replace("/app/uploads/media/", ""),
        previewKind: experiment.mediaType === 1 ? "video" : "image",
      };
    }

    setActivePiece(piece);

    if (!piece) {
      setCoords([]);
      return;
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
          if (!selectedSampleId) return true;
          return matchesSelectedId(amostra, selectedSampleId);
        });

        matchingSamples.forEach((amostra) => {
          const pieceData = (amostra.pecas || []).find((candidate) =>
            matchesSelectedId(candidate, selectedPieceId),
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

            const scaledPoint =
              coord.x <= 1 && coord.y <= 1 && coord.x >= 0 && coord.y >= 0
                ? {
                    ...coord,
                    x: coord.x * screenWidth,
                    y: coord.y * screenHeight,
                  }
                : { ...coord };

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

    setRadiusScale(scale);
    setCanvasSize(newCanvasSize);
    setCoords(scaledCoords);
    setCaptureFps(estimatedCaptureFps);
    setTimelineDurationMs(
      timelineOffset || validCoords[validCoords.length - 1]?.timestamp || 0,
    );
  }, [
    experiment,
    sessions,
    selectedSampleId,
    selectedPieceId,
    selectedSessionId,
    windowSize,
  ]);

  return {
    experiment,
    sessions,
    isLoading,
    error,
    activePiece,
    selectedSampleId,
    setSelectedSampleId,
    selectedPieceId,
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
