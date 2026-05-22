import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getPublicExperimentById } from "@/services/eyetrackingService";
import { useEyeTracking } from "@/hooks/useEyeTracking";

// Importação das Etapas
import NTestStepWelcome from "./steps/NTestStepWelcome";
import NTestStepTutorial from "./steps/NTestStepTutorial";
import NTestStepAlignment from "./steps/NTestStepAlignment";
import NTestStepCalibration from "./steps/NTestStepCalibration";
import NTestStepRunner from "./steps/NTestStepRunner";
import NTestStepResult from "./steps/NTestStepResult";

export default function NTestPage() {
  const { id } = useParams();
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado do Fluxo
  const [currentStep, setCurrentStep] = useState("WELCOME");

  // Dados Coletados
  const [participantInfo, setParticipantInfo] = useState({ nome: "", cpf: "" });
  const [sessionData, setSessionData] = useState([]);

  // Ref de Câmera (Este será atrelado ao vídeo invisível)
  const videoRef = useRef(null);

  // Hook de Eye Tracking
  const {
    mediaStream, // Pegando o stream novo que adicionamos no hook
    cameraActive,
    faceValid,
    mpLoaded,
    startCamera,
    stopCamera,
    addCalibrationPoint,
    finalizeCalibration,
    getCurrentGaze,
  } = useEyeTracking(videoRef);

  // Busca os dados do experimento
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

  const handleFinalizeCalibration = () => {
    finalizeCalibration();
    setCurrentStep("RUNNER");
  };

  const handleRunnerFinish = useCallback(
    (finalData) => {
      setSessionData(finalData);
      stopCamera();
      setCurrentStep("RESULT");
    },
    [stopCamera],
  );

  if (loading)
    return (
      <div className="p-10 text-center text-white">Carregando teste...</div>
    );
  if (error)
    return (
      <div className="p-10 text-center text-red-500 font-bold">{error}</div>
    );

  return (
    <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
      {/* VÍDEO FANTASMA: Alimenta o MediaPipe e nunca é desmontado */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -10,
        }}
      />

      <div className="relative flex-1 overflow-hidden">
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
            stream={mediaStream} // Passando stream em vez do ref do vídeo
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
            onFinish={handleRunnerFinish}
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
    </div>
  );
}
