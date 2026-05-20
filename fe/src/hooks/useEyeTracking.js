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

  const faceLandmarkerRef = useRef(null);
  const reqRef = useRef(null);
  const frameBuffer = useRef([]);
  const calibrationDataset = useRef([]);
  const latestFeatures = useRef(null);

  const modelX = useRef(null);
  const modelY = useRef(null);

  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
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
          }
        );
        setMpLoaded(true);
      } catch (err) {
        console.error("Erro ao carregar MediaPipe", err);
      }
    }
    initMediaPipe();

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
    };
  }, []);

  const startPredictionLoop = useCallback(() => {
    let lastVideoTime = -1;
    const loop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );

          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const nose = landmarks[1];
            const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);

            const isCenteredX = nose.x > 0.35 && nose.x < 0.65;
            const isCenteredY = nose.y > 0.35 && nose.y < 0.75;
            const isRightDistance = faceWidth > 0.2 && faceWidth < 0.6;

            setFaceValid(isCenteredX && isCenteredY && isRightDistance);

            const avgX = landmarks[468].x;
            const avgY = landmarks[468].y;
            latestFeatures.current = [
              1,
              avgX,
              avgY,
              avgX * avgY,
              avgX * avgX,
              avgY * avgY,
            ];

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
  }, [videoRef]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
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
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
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
