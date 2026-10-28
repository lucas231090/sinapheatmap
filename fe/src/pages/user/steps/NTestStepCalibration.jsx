import { useState, useEffect } from "react";
import { CALIBRATION_POINTS } from "@/utils/eyeTrackingMath";

export default function NTestStepCalibration({
  faceValid,
  addCalibrationPoint,
  clearFrameBuffer,
  onFinishCalibration,
}) {
  const [step, setStep] = useState(0);
  const [focusPhase, setFocusPhase] = useState("FINDING"); // FINDING, ACCUMULATING, READY
  const [isCollecting, setIsCollecting] = useState(false);

  // Quando o step muda, reseta a fase
  useEffect(() => {
    setFocusPhase("FINDING");
    setIsCollecting(false);
  }, [step]);

  // Máquina de estados baseada no tempo em que o rosto é válido
  useEffect(() => {
    if (!faceValid) return;

    let timer;

    if (focusPhase === "FINDING") {
      // 1000ms para o usuário encontrar o ponto na tela
      timer = setTimeout(() => {
        clearFrameBuffer(); // Limpa o histórico de movimento dos olhos até o ponto
        setFocusPhase("ACCUMULATING");
      }, 1000);
    } else if (focusPhase === "ACCUMULATING") {
      // 800ms coletando frames limpos enquanto o usuário fixa o olhar
      timer = setTimeout(() => {
        setFocusPhase("READY");
        setIsCollecting(true);

        const pt = CALIBRATION_POINTS[step];
        addCalibrationPoint(pt.x, pt.y);
      }, 800);
    } else if (focusPhase === "READY") {
      // 400ms para o flash verde de confirmação antes de ir pro próximo
      timer = setTimeout(() => {
        if (step === CALIBRATION_POINTS.length - 1) {
          onFinishCalibration();
        } else {
          setStep((s) => s + 1);
        }
      }, 400);
    }

    return () => clearTimeout(timer);
  }, [
    focusPhase,
    faceValid,
    step,
    clearFrameBuffer,
    addCalibrationPoint,
    onFinishCalibration,
  ]);

  const point = CALIBRATION_POINTS[step];
  const progressPct = (step / CALIBRATION_POINTS.length) * 100;

  // Mensagem de instrução contextual
  const instruction = isCollecting
    ? "Coletado!"
    : focusPhase === "FINDING"
      ? "Olhe para o ponto azul..."
      : "Segure o olhar...";

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-slate-950 text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 p-5 text-center">
        <p className="mb-3 font-bold text-white/80 text-xl">
          {instruction}{" "}
          <span className="text-white/40 text-sm">
            ({step + 1}/{CALIBRATION_POINTS.length})
          </span>
        </p>
        {/* Barra de progresso */}
        <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Aviso de rosto perdido ─────────────────────────────────────────── */}
      {!faceValid && (
        <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-pulse rounded-xl bg-red-600 px-6 py-4 text-center font-bold shadow-xl">
            Câmera perdeu seu rosto!
            <br />
            <span className="text-sm font-normal opacity-80">
              Centralize-se novamente.
            </span>
          </div>
        </div>
      )}

      {/* ── Ponto de calibração ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
        className="relative z-50 flex items-center justify-center"
      >
        {/* Anel de foco (indicando que está acumulando/esperando) */}
        {focusPhase === "ACCUMULATING" && faceValid && (
          <span className="absolute inline-flex size-14 animate-spin rounded-full border-4 border-blue-400 border-t-transparent opacity-80" />
        )}

        {/* Círculo principal */}
        <span
          className={`relative inline-flex size-10 rounded-full transition-all duration-300 ${
            isCollecting
              ? "scale-75 bg-green-400 shadow-[0_0_24px_8px_rgba(74,222,128,0.8)]"
              : focusPhase === "ACCUMULATING"
                ? "bg-blue-400 shadow-[0_0_16px_5px_rgba(59,130,246,0.8)] scale-110"
                : "bg-blue-900 opacity-50"
          }`}
        />
      </div>
    </div>
  );
}
