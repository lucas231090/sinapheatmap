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
import { useCallback } from "react";
import { useEyeTracking } from "@/hooks/useEyeTracking";

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

  // Ref de Câmera
  const videoRef = useRef(null);

  // Hook de Eye Tracking
  const {
    cameraActive,
    faceValid,
    mpLoaded,
    startCamera,
    addCalibrationPoint,
    finalizeCalibration,
    getCurrentGaze,
  } = useEyeTracking(videoRef);

  // 1. Busca os dados do experimento
  useEffect(() => {
    async function fetchTest() {
      try {
        const data = await getPublicExperimentById(id);
        setExperiment(data);
      } catch (err) {
        console.error("Erro ao buscar experimento:", err);
        setError("Não foi possível carregar este teste ou ele está inativo.");
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [id]);

  // Função chamada após a calibração
  const handleFinalizeCalibration = () => {
    finalizeCalibration();
    setCurrentStep("RUNNER");
  };

  // Callback para quando o runner terminar
  const handleRunnerFinish = useCallback((finalData) => {
    setSessionData(finalData);
    stopCamera();
    setCurrentStep("RESULT");
  }, [stopCamera]);

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
          onFinishCalibration={handleFinalizeCalibration}
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
