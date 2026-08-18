import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  clamp,
  dot,
  ransacLinear,
  adaptiveEMA,
  EAR_THRESHOLDS,
  BLINK_RECOVERY_FRAMES,
} from "@/utils/eyeTrackingMath";

/**
 * Hook para gerenciar câmera, detecção facial e Eye Tracking.
 *
 * Melhorias v2:
 *  - Vetor de features expandido (13 → 21): termos quadráticos médios,
 *    correlação binocular e interações íris×postura de cabeça — isso resolve
 *    a imprecisão nos cantos da tela.
 *  - headYaw corrigido: o fator ×0.01 foi removido; a feature estava tão
 *    pequena que a regularização ridge a anulava.
 *  - Máquina de estados de piscada (OPEN → BLINKING → RECOVERING): detecta
 *    início de piscada pela velocidade do EAR, congela o olhar no último
 *    ponto estável e aguarda estabilização antes de retomar.
 *  - clearFrameBuffer: permite à etapa de calibração descartar frames antigos
 *    ao avançar para o próximo ponto.
 *
 * @param {React.RefObject} videoRef - Ref do elemento <video> invisível.
 */
export function useEyeTracking(videoRef) {
  const [cameraActive, setCameraActive] = useState(false);
  const [faceValid, setFaceValid] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  // ─── Estado do MediaPipe (external store p/ useSyncExternalStore) ──────────
  const [mediaPipeStore] = useState(() => {
    let loaded = false;
    const listeners = new Set();
    return {
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot() {
        return loaded;
      },
      getServerSnapshot() {
        return false;
      },
      setLoaded(value) {
        loaded = value;
        listeners.forEach((l) => l());
      },
    };
  });

  const mpLoaded = useSyncExternalStore(
    mediaPipeStore.subscribe,
    mediaPipeStore.getSnapshot,
    mediaPipeStore.getServerSnapshot,
  );

  // ─── Refs de controle ─────────────────────────────────────────────────────
  const faceLandmarkerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const reqRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // Dados de eye tracking
  const frameBuffer = useRef([]); // Frames de olho aberto para calibração
  const calibrationDataset = useRef([]); // Conjunto acumulado de calibração
  const latestEyeData = useRef(null); // Última extração de features
  const modelX = useRef(null); // Coeficientes para predição X
  const modelY = useRef(null); // Coeficientes para predição Y
  const lastSmoothedGazeRef = useRef(null);

  // ─── Máquina de estados de piscada ────────────────────────────────────────
  // Estados possíveis: 'OPEN' → 'BLINKING' → 'RECOVERING' → 'OPEN'
  //
  // OPEN:       olho claramente aberto; gaze é atualizado normalmente.
  // BLINKING:   piscada detectada (EAR caiu abaixo de PRE_BLINK ou velocidade
  //             de queda ultrapassou o limiar); retorna posição congelada.
  // RECOVERING: olho reabriu mas íris ainda não estabilizou; mantém posição
  //             congelada por BLINK_RECOVERY_FRAMES frames.
  const blinkStateRef = useRef("OPEN");
  const earHistoryRef = useRef([]); // Histórico de EAR (últimos 10 frames)
  const frozenGazeRef = useRef(null); // Posição congelada durante piscada
  const recoveryCounterRef = useRef(0); // Contagem regressiva de recuperação

  // ─── Extração de features ─────────────────────────────────────────────────
  const buildEyeFeatures = useCallback((landmarks) => {
    // Landmarks dos olhos
    const rOuter = landmarks[33];
    const rInner = landmarks[133];
    const rIris = landmarks[468];
    const lOuter = landmarks[263];
    const lInner = landmarks[362];
    const lIris = landmarks[473];
    const rTop = landmarks[159];
    const rBottom = landmarks[145];
    const lTop = landmarks[386];
    const lBottom = landmarks[374];

    // Centros e dimensões dos olhos
    const rCenter = {
      x: (rOuter.x + rInner.x) / 2,
      y: (rOuter.y + rInner.y) / 2,
    };
    const lCenter = {
      x: (lOuter.x + lInner.x) / 2,
      y: (lOuter.y + lInner.y) / 2,
    };

    const rWidth = Math.max(
      1e-6,
      Math.hypot(rOuter.x - rInner.x, rOuter.y - rInner.y),
    );
    const lWidth = Math.max(
      1e-6,
      Math.hypot(lOuter.x - lInner.x, lOuter.y - lInner.y),
    );
    const rHeight = Math.max(
      1e-6,
      Math.hypot(rTop.x - rBottom.x, rTop.y - rBottom.y),
    );
    const lHeight = Math.max(
      1e-6,
      Math.hypot(lTop.x - lBottom.x, lTop.y - lBottom.y),
    );

    // EAR (Eye Aspect Ratio) — razão altura/largura de cada olho
    const rEAR = rHeight / rWidth;
    const lEAR = lHeight / lWidth;

    // Posição normalizada da íris dentro do olho ([-~0.5, ~0.5])
    const rX = (rIris.x - rCenter.x) / rWidth;
    const rY = (rIris.y - rCenter.y) / rHeight;
    const lX = (lIris.x - lCenter.x) / lWidth;
    const lY = (lIris.y - lCenter.y) / lHeight;

    // Média binocular (reduz ruído por olho individual)
    const avgX = (rX + lX) / 2;
    const avgY = (rY + lY) / 2;
    const avgEAR = (rEAR + lEAR) / 2;

    // Postura da cabeça
    const nose = landmarks[1];
    const eyeCenter = landmarks[168];
    const faceWidth = Math.hypot(
      landmarks[234].x - landmarks[454].x,
      landmarks[234].y - landmarks[454].y,
    );

    // headYaw: diferença de profundidade z entre cantos externos dos olhos.
    // CORREÇÃO: o ×0.01 original deixava este valor ~100× menor que as outras
    // features, fazendo a regularização ridge anulá-lo completamente.
    // Sem o fator adicional, fica em escala comparável às posições de íris.
    const headYaw = (lOuter.z - rOuter.z) * 10;
    const headPitch = (nose.y - eyeCenter.y) / Math.max(faceWidth, 1e-6);
    const roll = Math.atan2(lCenter.y - rCenter.y, lCenter.x - rCenter.x);

    return {
      features: [
        // ── Posições de íris individuais ──────────────────────────────────
        1, // bias
        lX,
        lY, // íris esquerda (espaço normalizado do olho)
        rX,
        rY, // íris direita

        // ── Média binocular — sinal primário, menos ruído ─────────────────
        avgX,
        avgY,

        // ── Termos quadráticos — capturam não-linearidade nos extremos ────
        lX * lX,
        lY * lY,
        rX * rX,
        rY * rY,
        avgX * avgX,
        avgY * avgY, // quadrático da média (mais estável)

        // ── Correlação binocular — ambos os olhos concordam na direção ────
        lX * rX, // concordância horizontal
        lY * rY, // concordância vertical

        // ── Postura da cabeça (escala corrigida) ──────────────────────────
        headYaw,
        headPitch,
        roll,

        // ── Interações íris × postura — CHAVE para precisão nos cantos ───
        // Ex: "olhando à direita E cabeça ligeiramente virada à direita"
        avgX * headYaw,
        avgY * headPitch,

        // ── Abertura do olho ──────────────────────────────────────────────
        avgEAR,
      ],
      avgEAR,
    };
  }, []);

  // ─── Inicialização do MediaPipe ───────────────────────────────────────────
  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          },
        );
        mediaPipeStore.setLoaded(true);
      } catch (err) {
        console.error("Erro ao carregar MediaPipe:", err);
      }
    }
    initMediaPipe();
  }, [mediaPipeStore]);

  // ─── Loop de predição ─────────────────────────────────────────────────────
  const startPredictionLoop = useCallback(() => {
    // Velocidade de queda do EAR que indica início de piscada (por frame a ~30 fps)
    const EAR_VELOCITY_THRESHOLD = -0.018;
    const { OPEN: EAR_OPEN, PRE_BLINK } = EAR_THRESHOLDS;

    const loop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        // Só processa se o frame for novo (evita detecções duplicadas)
        if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoRef.current.currentTime;

          const results = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now(),
          );

          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const nose = landmarks[1];
            const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);

            const isCenteredX = nose.x > 0.35 && nose.x < 0.65;
            const isCenteredY = nose.y > 0.35 && nose.y < 0.75;
            const isRightDistance = faceWidth > 0.2 && faceWidth < 0.6;
            setFaceValid(isCenteredX && isCenteredY && isRightDistance);

            const eyeData = buildEyeFeatures(landmarks);
            latestEyeData.current = eyeData;

            // ── Atualiza histórico de EAR ──────────────────────────────────
            const history = earHistoryRef.current;
            history.push(eyeData.avgEAR);
            if (history.length > 10) history.shift();

            // Velocidade de mudança do EAR (queda rápida = piscada começando)
            const earVelocity =
              history.length >= 2
                ? history[history.length - 1] - history[history.length - 2]
                : 0;

            // ── Máquina de estados de piscada ─────────────────────────────
            if (blinkStateRef.current === "OPEN") {
              // Detecta início: EAR abaixo do limiar OU queda muito rápida
              if (
                eyeData.avgEAR < PRE_BLINK ||
                earVelocity < EAR_VELOCITY_THRESHOLD
              ) {
                blinkStateRef.current = "BLINKING";
                // Congela o último olhar estável para servir durante a piscada
                frozenGazeRef.current = lastSmoothedGazeRef.current;
              }
            } else if (blinkStateRef.current === "BLINKING") {
              // Aguarda reabertura clara do olho
              if (eyeData.avgEAR >= EAR_OPEN) {
                blinkStateRef.current = "RECOVERING";
                recoveryCounterRef.current = BLINK_RECOVERY_FRAMES;
              }
            } else if (blinkStateRef.current === "RECOVERING") {
              // Contagem regressiva de estabilização pós-piscada
              recoveryCounterRef.current -= 1;
              if (recoveryCounterRef.current <= 0) {
                blinkStateRef.current = "OPEN";
                frozenGazeRef.current = null;
              }
            }

            // ── Buffer de calibração: apenas frames com olho claramente aberto
            // EAR_OPEN (0.26) é mais conservador que o antigo limiar de 0.22,
            // garantindo que coordenadas de íris corrompidas (pré-piscar)
            // nunca contaminem os dados de calibração.
            if (eyeData.avgEAR >= EAR_OPEN) {
              frameBuffer.current.push(eyeData.features);
              if (frameBuffer.current.length > 50) frameBuffer.current.shift();
            }
          } else {
            // Rosto perdido — resetar estado para evitar gaze congelado obsoleto
            setFaceValid(false);
            blinkStateRef.current = "OPEN";
            frozenGazeRef.current = null;
            earHistoryRef.current = [];
          }
        }
      }
      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
  }, [videoRef, buildEyeFeatures]);

  // ─── Controles de câmera ──────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        startPredictionLoop();
      }
    } catch (err) {
      console.error("Erro ao iniciar câmera:", err);
      alert("Precisamos de acesso à câmera para prosseguir.");
    }
  }, [startPredictionLoop, videoRef]);

  const stopCamera = useCallback(() => {
    const stream = mediaStreamRef.current ?? videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
    setMediaStream(null);
    setCameraActive(false);
    setFaceValid(false);
    if (reqRef.current) cancelAnimationFrame(reqRef.current);

    // Resetar estado de piscada
    blinkStateRef.current = "OPEN";
    frozenGazeRef.current = null;
    earHistoryRef.current = [];
    recoveryCounterRef.current = 0;
    lastSmoothedGazeRef.current = null;
    latestEyeData.current = null;
  }, [videoRef]);

  // ─── Calibração ──────────────────────────────────────────────────────────
  /**
   * Descarta frames acumulados no buffer de calibração.
   * Deve ser chamado ao avançar para cada novo ponto de calibração, para que
   * apenas frames onde o usuário já estava olhando para o novo ponto sejam
   * usados — evita contaminação pelo olhar do ponto anterior.
   */
  const clearFrameBuffer = useCallback(() => {
    frameBuffer.current = [];
  }, []);

  const addCalibrationPoint = useCallback((targetX, targetY) => {
    frameBuffer.current.forEach((feat) => {
      calibrationDataset.current.push({ features: feat, targetX, targetY });
    });
  }, []);

  const finalizeCalibration = useCallback(() => {
    modelX.current = ransacLinear(calibrationDataset.current, (s) => s.targetX);
    modelY.current = ransacLinear(calibrationDataset.current, (s) => s.targetY);
  }, []);

  // ─── Predição de olhar ────────────────────────────────────────────────────
  const getCurrentGaze = useCallback(() => {
    if (!latestEyeData.current || !modelX.current || !modelY.current) {
      return null;
    }

    // Durante piscada ou recuperação: retorna a última posição estável congelada.
    // Isso evita o artefato de "olhar para baixo" causado pela distorção das
    // coordenadas de íris enquanto a pálpebra fecha/abre.
    if (blinkStateRef.current !== "OPEN") {
      if (!frozenGazeRef.current) return null;
      return {
        x: frozenGazeRef.current.x,
        y: frozenGazeRef.current.y,
        timestamp: Date.now(),
      };
    }

    const pX = clamp(dot(modelX.current, latestEyeData.current.features), 0, 1);
    const pY = clamp(dot(modelY.current, latestEyeData.current.features), 0, 1);

    const smoothedGaze = adaptiveEMA(
      { x: pX, y: pY },
      lastSmoothedGazeRef.current,
    );
    lastSmoothedGazeRef.current = smoothedGaze;

    // Mantém referência congelada atualizada para quando a próxima piscada ocorrer
    frozenGazeRef.current = smoothedGaze;

    return { x: smoothedGaze.x, y: smoothedGaze.y, timestamp: Date.now() };
  }, []);

  // ─── Limpeza ─────────────────────────────────────────────────────────────
  const stopLandmarker = useCallback(() => {
    if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      stopLandmarker();
    };
  }, [stopCamera, stopLandmarker]);

  // ─── API pública ──────────────────────────────────────────────────────────
  return {
    mediaStream,
    cameraActive,
    faceValid,
    mpLoaded,
    startCamera,
    stopCamera,
    addCalibrationPoint,
    clearFrameBuffer, // NOVO: necessário para NTestStepCalibration
    finalizeCalibration,
    getCurrentGaze,
  };
}
