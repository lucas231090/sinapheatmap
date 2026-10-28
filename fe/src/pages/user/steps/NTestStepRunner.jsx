import { useState, useEffect, useRef, useReducer } from "react";
import { shuffleArray } from "@/utils/eyeTrackingMath";
import { getFileMedia } from "@/services/fileService";
import { getPublicMediaUrl } from "@/services/api";

const estimateCaptureFps = (points) => {
  if (!Array.isArray(points) || points.length < 2) return 0;

  const deltas = [];
  for (let index = 1; index < points.length; index += 1) {
    const previousTimestamp = Number(points[index - 1]?.timestamp);
    const currentTimestamp = Number(points[index]?.timestamp);
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

const playerReducer = (state, action) => {
  switch (action.type) {
    case "DECREMENT_COUNT":
      return { ...state, count: state.count - 1 };
    case "START_EXPOSURE":
      return { ...state, phase: "EXPOSURE" };
    case "NEXT_PIECE":
      return {
        ...state,
        phase: "COUNTDOWN",
        count: 3,
        currentPieceIdx: state.currentPieceIdx + 1,
        mediaUrl: "",
      };
    case "START_PAUSE":
      return { ...state, phase: "PAUSE", mediaUrl: "" };
    case "NEXT_SAMPLE":
      return {
        ...state,
        phase: "COUNTDOWN",
        count: 3,
        currentSampleIdx: state.currentSampleIdx + 1,
        currentPieceIdx: 0,
        mediaUrl: "",
      };
    case "SET_MEDIA_URL":
      return { ...state, mediaUrl: action.payload };
    default:
      return state;
  }
};

export default function NTestStepRunner({
  experiment,
  getCurrentGaze,
  faceValid,
  onFinish,
}) {
  const [samplesList] = useState(() => {
    let sList = [...experiment.samples];
    if (experiment.organization?.randomizeSamples) sList = shuffleArray(sList);

    const result = [];
    for (const sample of sList) {
      let pList = [];
      for (const piece of experiment.pieces) {
        if (piece.sampleId === sample.id) pList.push(piece);
      }
      if (pList.length > 0) {
        if (experiment.organization?.randomizePieces) {
          pList = shuffleArray(pList);
        }
        result.push({ ...sample, pieces: pList });
      }
    }
    return result;
  });

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const [playerState, dispatchPlayer] = useReducer(playerReducer, {
    phase: "COUNTDOWN",
    count: 3,
    currentSampleIdx: 0,
    currentPieceIdx: 0,
    mediaUrl: "",
  });

  const { phase, count, currentSampleIdx, currentPieceIdx, mediaUrl } = playerState;
  const [debugGaze, setDebugGaze] = useState(null);
  const displayDebugGaze = phase === "EXPOSURE" ? debugGaze : null;

  const showDebugGaze =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.DEV
      : false;

  // Armazena todos os resultados finais do teste
  const sessionOutput = useRef([]);
  // Armazena os rastros da peça ATUAL
  const currentEyeData = useRef([]);
  const faceValidRef = useRef(faceValid);
  const mediaRef = useRef(null);

  useEffect(() => {
    faceValidRef.current = faceValid;
  }, [faceValid]);

  // 2. Loop de Coleta de Dados
  useEffect(() => {
    let frameId;

    if (phase === "EXPOSURE") {
      const startTime = performance.now();
      let frame = 0;

      const loop = () => {
        if (faceValidRef.current) {
          const gaze = getCurrentGaze();
          if (gaze) {
            if (showDebugGaze) {
              setDebugGaze({
                x: gaze.x * window.innerWidth,
                y: gaze.y * window.innerHeight,
              });
            }

            const now = performance.now();
            let preciseTimestamp = now - startTime;

            // Se for vídeo, sincroniza perfeitamente com o tempo real do vídeo
            if (mediaRef.current && typeof mediaRef.current.currentTime !== "undefined") {
              preciseTimestamp = mediaRef.current.currentTime * 1000;
            }

            currentEyeData.current.push({
              timestamp: preciseTimestamp,
              x: gaze.x * window.innerWidth,
              y: gaze.y * window.innerHeight,
              normalized_x: gaze.x,
              normalized_y: gaze.y,
              screen_width: window.innerWidth,
              screen_height: window.innerHeight,
              frame: frame++,
            });
          }
        }

        frameId = requestAnimationFrame(loop);
      };

      frameId = requestAnimationFrame(loop);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [phase, getCurrentGaze, showDebugGaze]);

  useEffect(() => {
    const activeSample = samplesList[currentSampleIdx];
    const activePiece = activeSample?.pieces?.[currentPieceIdx];

    if (!activePiece) {
      return undefined;
    }

    if (activePiece.sourceType === "url" && activePiece.sourceUrl) {
      dispatchPlayer({ type: "SET_MEDIA_URL", payload: getPublicMediaUrl(activePiece.sourceUrl) });
      return undefined;
    }

    if (activePiece.sourceUrl) {
      dispatchPlayer({ type: "SET_MEDIA_URL", payload: getPublicMediaUrl(activePiece.sourceUrl) });
      return undefined;
    }

    if (activePiece.mediaPath) {
      dispatchPlayer({ type: "SET_MEDIA_URL", payload: getPublicMediaUrl(activePiece.mediaPath) });
      return undefined;
    }

    if (activePiece.previewUrl) {
      dispatchPlayer({ type: "SET_MEDIA_URL", payload: activePiece.previewUrl });
      return undefined;
    }

    let cancelled = false;
    let resolvedUrl = "";

    const mediaSource =
      activePiece.mediaPath ||
      experiment.mediaPath ||
      activePiece.fileName ||
      activePiece.sourceLabel;

    getFileMedia(mediaSource)
      .then((url) => {
        if (!cancelled) {
          resolvedUrl = url;
          dispatchPlayer({ type: "SET_MEDIA_URL", payload: url });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatchPlayer({ type: "SET_MEDIA_URL", payload: "" });
        }
      });

    return () => {
      cancelled = true;
      if (resolvedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resolvedUrl);
      }
    };
  }, [samplesList, currentSampleIdx, currentPieceIdx, experiment.mediaPath]);

  // 3. Countdown timer
  useEffect(() => {
    if (phase !== "COUNTDOWN") return;
    if (count > 0) {
      const t = setTimeout(() => {
        dispatchPlayer({ type: "DECREMENT_COUNT" });
      }, 1000);
      return () => clearTimeout(t);
    } else {
      dispatchPlayer({ type: "START_EXPOSURE" });
    }
  }, [phase, count]);

  // 4. Exposure timer
  useEffect(() => {
    if (phase !== "EXPOSURE") return;
    if (samplesList.length === 0) return;

    const activeSample = samplesList[currentSampleIdx];
    const activePiece = activeSample.pieces[currentPieceIdx];

    const ms = Number(activePiece.exposureSeconds) * 1000;
    const t = setTimeout(() => {
      const captureFps = estimateCaptureFps(currentEyeData.current);

      // Salva os dados desta peça
      const savedPiece = {
        peca_id: activePiece.id,
        ordem_apresentacao: currentPieceIdx + 1,
        exposure_seconds: Number(activePiece.exposureSeconds) || 0,
        capture_fps: captureFps,
        sample_count: currentEyeData.current.length,
        dados_eyetracking: [...currentEyeData.current],
      };
      currentEyeData.current = []; // Reseta pro próximo

      // Salva localmente
      if (!sessionOutput.current[currentSampleIdx]) {
        sessionOutput.current[currentSampleIdx] = {
          amostra_id: activeSample.id,
          ordem_apresentacao: currentSampleIdx + 1,
          pecas: [],
        };
      }
      sessionOutput.current[currentSampleIdx].pecas.push(savedPiece);

      // Verifica se tem mais peça ou amostra
      if (currentPieceIdx + 1 < activeSample.pieces.length) {
        dispatchPlayer({ type: "NEXT_PIECE" });
      } else if (currentSampleIdx + 1 < samplesList.length) {
        dispatchPlayer({ type: "START_PAUSE" });
      } else {
        // ACABOU TUDO
        onFinishRef.current(sessionOutput.current);
      }
    }, ms);
    return () => clearTimeout(t);
  }, [phase, samplesList, currentSampleIdx, currentPieceIdx]);

  // RENDERIZAÇÃO
  if (phase === "COUNTDOWN") {
    return <CountdownPhase count={count} />;
  }

  if (phase === "PAUSE") {
    return <PausePhase onNext={() => dispatchPlayer({ type: "NEXT_SAMPLE" })} />;
  }

  if (phase === "EXPOSURE" && samplesList.length > 0) {
    const activePiece = samplesList[currentSampleIdx].pieces[currentPieceIdx];
    return (
      <ExposurePhase
        activePiece={activePiece}
        faceValid={faceValid}
        mediaUrl={mediaUrl}
        showDebugGaze={showDebugGaze}
        displayDebugGaze={displayDebugGaze}
        mediaRef={mediaRef}
      />
    );
  }

  return null;
}

function CountdownPhase({ count }) {
  return (
    <div className="flex h-screen bg-slate-950 w-full items-center justify-center bg-transparent">
      <div className="flex size-32 items-center justify-center rounded-full border-4 border-white bg-slate-950/30 animate-pulse backdrop-blur-md">
        <span className="text-6xl font-bold">
          {count === 0 ? "!" : count}
        </span>
      </div>
    </div>
  );
}

function PausePhase({ onNext }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent p-8">
      <div className="max-w-md rounded-[2rem] border border-white/15 bg-slate-950/35 p-8 text-center text-white shadow-2xl backdrop-blur-md">
        <h2 className="text-2xl font-bold mb-4">Etapa Concluída</h2>
        <p className="mb-6 text-slate-200">
          Você finalizou uma etapa do teste. Descanse os olhos e clique abaixo
          quando estiver pronto.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-full bg-sinapgreen-500 px-6 py-3 font-bold text-black"
        >
          Ir para próxima amostra
        </button>
      </div>
    </div>
  );
}

function ExposurePhase({ activePiece, faceValid, mediaUrl, showDebugGaze, displayDebugGaze, mediaRef }) {
  const isVideo = activePiece?.previewKind === "video";
  const shouldCover = activePiece?.imageDisplayMode === "cover";
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950">
      {!faceValid && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full z-50 animate-pulse font-bold shadow-lg">
          Atenção: Seu rosto saiu da área de rastreio!
        </div>
      )}

      {!mediaUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
          Carregando mídia&hellip;
        </div>
      )}

      <div
        className={
          shouldCover
            ? "absolute inset-0"
            : "flex h-full w-full items-center justify-center"
        }
      >
        {isVideo ? (
          <video
            ref={mediaRef}
            src={mediaUrl}
            autoPlay
            muted
            playsInline
            aria-label="Vídeo do experimento"
            className={
              shouldCover
                ? "h-full w-full object-contain"
                : "max-h-full max-w-full object-contain"
            }
          >
            <track kind="captions" />
          </video>
        ) : (
          <img
            ref={mediaRef}
            src={mediaUrl}
            alt="peça"
            className={
              shouldCover
                ? "h-full w-full object-contain"
                : "max-h-full max-w-full object-contain"
            }
          />
        )}
      </div>

      {showDebugGaze && displayDebugGaze && (
        <div
          className="pointer-events-none absolute z-[60] size-4 rounded-full border-2 border-white bg-sinapgreen-500 shadow-[0_0_18px_rgba(34,197,94,0.9)]"
          style={{
            left: `${displayDebugGaze.x}px`,
            top: `${displayDebugGaze.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );

  return null;
}
