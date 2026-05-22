import { useEffect, useState, useRef, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { clamp, dot, ransacLinear } from "@/utils/eyeTrackingMath";

/**
 * Hook para gerenciar a câmera, a detecção facial e a calibração do Eye Tracking.
 * @param {Object} videoRef - Referência do elemento <video> no DOM.
 * @returns {Object} Estados e funções para controle do Eye Tracking.
 */
export function useEyeTracking(videoRef) {
  const [cameraActive, setCameraActive] = useState(false);
  const [faceValid, setFaceValid] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [mediaStream, setMediaStream] = useState(null); // NOVO: Guarda o stream para a UI

  const faceLandmarkerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const reqRef = useRef(null);
  const frameBuffer = useRef([]);
  const calibrationDataset = useRef([]);
  const latestFeatures = useRef(null);
  const lastVideoTimeRef = useRef(-1); // NOVO: Evita duplicar frames no MediaPipe

  const modelX = useRef(null);
  const modelY = useRef(null);

  const buildEyeFeatures = useCallback((landmarks) => {
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

    const rEAR = rHeight / rWidth;
    const lEAR = lHeight / lWidth;

    const rX = (rIris.x - rCenter.x) / rWidth;
    const rY = (rIris.y - rCenter.y) / rHeight;
    const lX = (lIris.x - lCenter.x) / lWidth;
    const lY = (lIris.y - lCenter.y) / lHeight;

    const avgX = (rX + lX) / 2;
    const avgY = (rY + lY) / 2;
    const avgEAR = (rEAR + lEAR) / 2;

    const nose = landmarks[1];
    const eyeCenter = landmarks[168];
    const faceWidth = Math.hypot(
      landmarks[234].x - landmarks[454].x,
      landmarks[234].y - landmarks[454].y,
    );

    const headYaw = (lOuter.z - rOuter.z) * 10;
    const headPitch = (nose.y - eyeCenter.y) / Math.max(faceWidth, 1e-6);
    const roll = Math.atan2(lCenter.y - rCenter.y, lCenter.x - rCenter.x);

    return [
      1,
      avgX,
      avgY,
      avgEAR,
      avgX * avgY,
      avgX * avgX,
      avgY * avgY,
      headYaw * 0.01,
      headPitch,
      roll,
    ];
  }, []);

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
        setMpLoaded(true);
      } catch (err) {
        console.error("Erro ao carregar MediaPipe", err);
      }
    }
    initMediaPipe();

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
    };
  }, []);

  const startPredictionLoop = useCallback(() => {
    const loop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        // TRAVA DE SEGURANÇA: Só processa se o frame for novo
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

            latestFeatures.current = buildEyeFeatures(landmarks);

            frameBuffer.current.push(latestFeatures.current);
            if (frameBuffer.current.length > 30) frameBuffer.current.shift();
          } else {
            setFaceValid(false);
          }
        }
      }
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);
  }, [videoRef, buildEyeFeatures]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream); // NOVO: Salva o stream para exibir na UI

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
  };

  const stopCamera = useCallback(() => {
    const stream = mediaStreamRef.current || videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    setMediaStream(null); // Limpa o stream exportado
    setCameraActive(false);
    setFaceValid(false);
    if (reqRef.current) {
      cancelAnimationFrame(reqRef.current);
    }
  }, [videoRef]);

  const addCalibrationPoint = (targetX, targetY) => {
    frameBuffer.current.forEach((feat) => {
      calibrationDataset.current.push({ features: feat, targetX, targetY });
    });
  };

  const finalizeCalibration = () => {
    modelX.current = ransacLinear(calibrationDataset.current, (s) => s.targetX);
    modelY.current = ransacLinear(calibrationDataset.current, (s) => s.targetY);
  };

  const getCurrentGaze = useCallback(() => {
    if (!latestFeatures.current || !modelX.current || !modelY.current) {
      return null;
    }
    let pX = clamp(dot(modelX.current, latestFeatures.current), 0, 1);
    let pY = clamp(dot(modelY.current, latestFeatures.current), 0, 1);
    return { x: pX, y: pY, timestamp: Date.now() };
  }, []);

  return {
    mediaStream, // Exportado para uso nas telas
    cameraActive,
    faceValid,
    mpLoaded,
    startCamera,
    stopCamera,
    addCalibrationPoint,
    finalizeCalibration,
    getCurrentGaze,
  };
}
