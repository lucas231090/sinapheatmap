import { useState, useEffect, useRef } from "react";
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

export default function NTestStepRunner({
  experiment,
  getCurrentGaze,
  faceValid,
  onFinish,
}) {
  const [phase, setPhase] = useState("INIT"); // INIT | COUNTDOWN | EXPOSURE | PAUSE
  const [count, setCount] = useState(3);

  const [samplesList, setSamplesList] = useState([]);
  const [currentSampleIdx, setCurrentSampleIdx] = useState(0);
  const [currentPieceIdx, setCurrentPieceIdx] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");
  const [debugGaze, setDebugGaze] = useState(null);

  const showDebugGaze =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.DEV
      : false;

  // Armazena todos os resultados finais do teste
  const sessionOutput = useRef([]);
  // Armazena os rastros da peça ATUAL
  const currentEyeData = useRef([]);
  const faceValidRef = useRef(faceValid);

  useEffect(() => {
    faceValidRef.current = faceValid;
  }, [faceValid]);

  // 1. Organiza a fila de reprodução (Randomização)
  useEffect(() => {
    let sList = [...experiment.samples];
    if (experiment.organization?.randomizeSamples) sList = shuffleArray(sList);

    const preparedSamples = sList
      .map((sample) => {
        let pList = experiment.pieces.filter((p) => p.sampleId === sample.id);
        if (experiment.organization?.randomizePieces)
          pList = shuffleArray(pList);
        return { ...sample, pieces: pList };
      })
      .filter((s) => s.pieces.length > 0);

    setSamplesList(preparedSamples);
    setPhase("COUNTDOWN");

    // Adicione a linha de comentário abaixo para o ESLint ignorar este array vazio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            currentEyeData.current.push({
              timestamp: now - startTime,
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

    if (phase !== "EXPOSURE" && showDebugGaze) {
      setDebugGaze(null);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [phase, getCurrentGaze, showDebugGaze]);

  useEffect(() => {
    const activeSample = samplesList[currentSampleIdx];
    const activePiece = activeSample?.pieces?.[currentPieceIdx];

    setMediaUrl("");

    if (!activePiece) {
      return undefined;
    }

    if (activePiece.sourceType === "url" && activePiece.sourceUrl) {
      setMediaUrl(getPublicMediaUrl(activePiece.sourceUrl));
      return undefined;
    }

    if (activePiece.sourceUrl) {
      setMediaUrl(getPublicMediaUrl(activePiece.sourceUrl));
      return undefined;
    }

    if (activePiece.mediaPath) {
      setMediaUrl(getPublicMediaUrl(activePiece.mediaPath));
      return undefined;
    }

    if (activePiece.previewUrl) {
      setMediaUrl(activePiece.previewUrl);
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
          setMediaUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMediaUrl("");
        }
      });

    return () => {
      cancelled = true;
      if (resolvedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resolvedUrl);
      }
    };
  }, [samplesList, currentSampleIdx, currentPieceIdx, experiment.mediaPath]);

  // 3. Máquina de Estados de Reprodução
  useEffect(() => {
    if (samplesList.length === 0) return;
    const activeSample = samplesList[currentSampleIdx];
    const activePiece = activeSample.pieces[currentPieceIdx];

    if (phase === "COUNTDOWN") {
      if (count > 0) {
        const t = setTimeout(() => setCount((c) => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        setPhase("EXPOSURE");
      }
    }

    if (phase === "EXPOSURE") {
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
          setCurrentPieceIdx((i) => i + 1);
          setCount(3);
          setPhase("COUNTDOWN");
        } else if (currentSampleIdx + 1 < samplesList.length) {
          setPhase("PAUSE");
        } else {
          // ACABOU TUDO
          onFinish(sessionOutput.current);
        }
      }, ms);
      return () => clearTimeout(t);
    }
  }, [phase, count, samplesList, currentSampleIdx, currentPieceIdx, onFinish]); // Adicionado onFinish
  // RENDERIZAÇÃO
  if (phase === "COUNTDOWN") {
    return (
      <div className="flex h-screen bg-black w-full items-center justify-center bg-transparent">
        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-slate-950/30 animate-pulse backdrop-blur-md">
          <span className="text-6xl font-bold">
            {count === 0 ? "!" : count}
          </span>
        </div>
      </div>
    );
  }

  if (phase === "PAUSE") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent p-8">
        <div className="max-w-md rounded-[2rem] border border-white/15 bg-slate-950/35 p-8 text-center text-white shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-4">Etapa Concluída</h2>
          <p className="mb-6 text-slate-200">
            Você finalizou uma etapa do teste. Descanse os olhos e clique abaixo
            quando estiver pronto.
          </p>
          <button
            onClick={() => {
              setCurrentSampleIdx((i) => i + 1);
              setCurrentPieceIdx(0);
              setCount(3);
              setPhase("COUNTDOWN");
            }}
            className="w-full rounded-full bg-sinapgreen-500 px-6 py-3 font-bold text-black"
          >
            Ir para próxima amostra
          </button>
        </div>
      </div>
    );
  }
  if (phase === "EXPOSURE" && samplesList.length > 0) {
    const activePiece = samplesList[currentSampleIdx].pieces[currentPieceIdx];
    const isVideo = activePiece.previewKind === "video";
    const shouldCover = activePiece.imageDisplayMode === "cover";
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        {!faceValid && (
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full z-50 animate-pulse font-bold shadow-lg">
            Atenção: Seu rosto saiu da área de rastreio!
          </div>
        )}

        {!mediaUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
            Carregando mídia...
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
              src={mediaUrl}
              autoPlay
              muted
              playsInline
              className={
                shouldCover
                  ? "h-full w-full object-contain"
                  : "max-h-full max-w-full object-contain"
              }
            />
          ) : (
            <img
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

        {showDebugGaze && debugGaze && (
          <div
            className="pointer-events-none absolute z-[60] h-4 w-4 rounded-full border-2 border-white bg-sinapgreen-500 shadow-[0_0_18px_rgba(34,197,94,0.9)]"
            style={{
              left: `${debugGaze.x}px`,
              top: `${debugGaze.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </div>
    );
  }

  return null;
}
