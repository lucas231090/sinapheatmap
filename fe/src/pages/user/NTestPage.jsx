import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getPublicExperimentById } from "@/services/eyetrackingService";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  clamp,
  dot,
  ransacLinear,
  CALIBRATION_POINTS,
} from "@/utils/eyeTrackingMath";
import { useCallback } from "react"; // Adicione useCallback aqui!

// Importação das Etapas (Criaremos abaixo)
import NTestStepWelcome from "./steps/NTestStepWelcome";
import NTestStepTutorial from "./steps/NTestStepTutorial";
import NTestStepAlignment from "./steps/NTestStepAlignment";
import NTestStepCalibration from "./steps/NTestStepCalibration";
import NTestStepRunner from "./steps/NTestStepRunner";
import NTestStepResult from "./steps/NTestStepResult";

const TARGET_SAMPLE_HZ = 60;
const TARGET_SAMPLE_DT = 1 / TARGET_SAMPLE_HZ;

export default function NTestPage() {
  const { id } = useParams();
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado do Fluxo
  const [currentStep, setCurrentStep] = useState("WELCOME"); // WELCOME | TUTORIAL | ALIGNMENT | CALIBRATION | RUNNER | RESULT

  // Dados Coletados
  const [participantInfo, setParticipantInfo] = useState({ nome: "", cpf: "" });
  const [sessionData, setSessionData] = useState([]); // Array de amostras coletadas

  // Ref de Câmera e MediaPipe
  const videoRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const reqRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceValid, setFaceValid] = useState(false); // Rosto centralizado/válido?
  const [mpLoaded, setMpLoaded] = useState(false);

  // Modelos de Calibração e Buffers
  const modelX = useRef(null);
  const modelY = useRef(null);
  const frameBuffer = useRef([]);
  const calibrationDataset = useRef([]);
  const latestFeatures = useRef(null); // Últimas features capturadas da face

  // 1. Busca os dados do experimento
  useEffect(() => {
    async function fetchTest() {
      try {
        const data = await getPublicExperimentById(id);
        setExperiment(data);
      } catch (err) {
        console.error("Erro ao buscar experimento:", err); // Correção do erro da linha 61
        setError("Não foi possível carregar este teste ou ele está inativo.");
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [id]);

  // 2. Carrega o MediaPipe (ocorre em background enquanto o usuário lê o Welcome)
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
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
    };
  }, []);

  // 3. Função para iniciar a câmera (chamada pelo Alignment Step)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraActive(true);
      startPredictionLoop();
    } catch (err) {
      console.error("Erro ao iniciar câmera:", err); // Correção do erro da linha 111
      alert("Precisamos de acesso à câmera para prosseguir.");
    }
  };

  // 4. Loop de predição contínuo (roda invisível por trás das telas)
  const startPredictionLoop = () => {
    let lastVideoTime = -1;
    const loop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now(),
          );

          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const nose = landmarks[1];
            const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);

            // Validação de face simples (pode ser ajustada)
            const isCenteredX = nose.x > 0.35 && nose.x < 0.65;
            const isCenteredY = nose.y > 0.35 && nose.y < 0.75;
            const isRightDistance = faceWidth > 0.2 && faceWidth < 0.6;

            setFaceValid(isCenteredX && isCenteredY && isRightDistance);

            // Extração fictícia/simplificada para caber (Use o seu getEyeData completo aqui)
            // Para brevidade, estou mockando as features. Substitua pelo seu `getEyeData(landmarks)`
            const avgX = landmarks[468].x; // Iris direita
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
  };

  // 5. Função de calibração a ser passada para NTestStepCalibration
  const addCalibrationPoint = (targetX, targetY) => {
    frameBuffer.current.forEach((feat) => {
      calibrationDataset.current.push({ features: feat, targetX, targetY });
    });
  };

  const finalizeCalibration = () => {
    modelX.current = ransacLinear(calibrationDataset.current, (s) => s.targetX);
    modelY.current = ransacLinear(calibrationDataset.current, (s) => s.targetY);
    setCurrentStep("RUNNER");
  };

  // 6. Função para obter o olhar atual durante o RUNNER
  const getCurrentGaze = useCallback(() => {
    if (!latestFeatures.current || !modelX.current || !modelY.current)
      return null;
    let pX = clamp(dot(modelX.current, latestFeatures.current), 0, 1);
    let pY = clamp(dot(modelY.current, latestFeatures.current), 0, 1);
    return { x: pX, y: pY, timestamp: Date.now() };
  }, []); // Sem dependências dinâmicas, pois usamos refs

  // Callback para quando o runner terminar
  const handleRunnerFinish = useCallback((finalData) => {
    setSessionData(finalData);
    setCurrentStep("RESULT");
  }, []);

  // Renderização das Telas
  if (loading)
    return (
      <div className="p-10 text-center text-white">Carregando teste...</div>
    );
  if (error)
    return (
      <div className="p-10 text-center text-red-500 font-bold">{error}</div>
    );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {/* 
        A CÂMERA GLOBAL 
        Ela fica visível no modo ALIGNMENT. Nos outros modos, fica escondida (opacidade 0 
        e pointer-events none), exceto se a face se perder na Calibração.
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute rounded-xl shadow-lg transition-all duration-500 z-[999] ${
          currentStep === "ALIGNMENT"
            ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[640px] h-[480px] opacity-100 scale-x-[-1]"
            : currentStep === "CALIBRATION" && !faceValid
            ? "top-4 right-4 w-[240px] h-[180px] opacity-100 scale-x-[-1] border-2 border-red-500"
            : "opacity-0 pointer-events-none w-[10px] h-[10px]"
        }`}
      />

      {/* Roteador de Etapas */}
      {currentStep === "WELCOME" && (
        <NTestStepWelcome
          experiment={experiment.experiment}
          onNext={(info) => {
            setParticipantInfo(info);
            setCurrentStep("TUTORIAL");
          }}
        />
      )}

      {currentStep === "TUTORIAL" && (
        <NTestStepTutorial onNext={() => setCurrentStep("ALIGNMENT")} />
      )}

      {currentStep === "ALIGNMENT" && (
        <NTestStepAlignment
          mpLoaded={mpLoaded}
          startCamera={startCamera}
          cameraActive={cameraActive}
          faceValid={faceValid}
          onNext={() => setCurrentStep("CALIBRATION")}
        />
      )}

      {currentStep === "CALIBRATION" && (
        <NTestStepCalibration
          faceValid={faceValid}
          addCalibrationPoint={addCalibrationPoint}
          onFinishCalibration={finalizeCalibration}
        />
      )}

      {currentStep === "RUNNER" && (
        <NTestStepRunner
          experiment={experiment.experiment}
          getCurrentGaze={getCurrentGaze}
          faceValid={faceValid}
          onFinish={handleRunnerFinish} // Usa o callback memorizado
        />
      )}

      {currentStep === "RESULT" && (
        <NTestStepResult
          experimentId={experiment.id}
          participantInfo={participantInfo}
          sessionData={sessionData}
        />
      )}
    </div>
  );
}
