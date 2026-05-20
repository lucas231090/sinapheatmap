import { useState, useEffect, useRef } from "react";
import { shuffleArray } from "@/utils/eyeTrackingMath";
import { getFileMedia } from "@/services/fileService";

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

  // Armazena todos os resultados finais do teste
  const sessionOutput = useRef([]);
  // Armazena os rastros da peça ATUAL
  const currentEyeData = useRef([]);

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
    let interval;
    if (phase === "EXPOSURE" && faceValid) {
      const startTime = Date.now();
      let frame = 0;
      interval = setInterval(() => {
        const gaze = getCurrentGaze();
        if (gaze) {
          currentEyeData.current.push({
            timestamp: Date.now() - startTime,
            x: gaze.x,
            y: gaze.y,
            frame: frame++,
          });
        }
      }, 1000 / 60);
    }
    return () => clearInterval(interval);
  }, [phase, faceValid, getCurrentGaze]); // Adicionado getCurrentGaze

  useEffect(() => {
    const activeSample = samplesList[currentSampleIdx];
    const activePiece = activeSample?.pieces?.[currentPieceIdx];

    setMediaUrl("");

    if (!activePiece) {
      return undefined;
    }

    if (activePiece.sourceType === "url" && activePiece.sourceUrl) {
      setMediaUrl(activePiece.sourceUrl);
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
        // Salva os dados desta peça
        const savedPiece = {
          peca_id: activePiece.id,
          ordem_apresentacao: currentPieceIdx + 1,
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
      <div className="flex items-center justify-center w-full h-full bg-black">
        <div className="w-32 h-32 rounded-full border-4 border-white flex items-center justify-center animate-pulse">
          <span className="text-6xl font-bold">
            {count === 0 ? "!" : count}
          </span>
        </div>
      </div>
    );
  }

  if (phase === "PAUSE") {
    return (
      <div className="flex items-center justify-center w-full h-full bg-cyan-700">
        <div className="bg-white text-black p-8 rounded-2xl text-center max-w-md shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Etapa Concluída</h2>
          <p className="mb-6 text-slate-600">
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
            className="px-6 py-3 bg-[#00C8E6] font-bold rounded-full w-full"
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

    return (
      <div className="w-full h-full bg-black flex items-center justify-center relative">
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

        {isVideo ? (
          <video
            src={mediaUrl}
            autoPlay
            muted
            // Opcional: loop (adicione se quiser que o vídeo repita até o tempo de exposição acabar)
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="peça"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
    );
  }

  return null;
}
