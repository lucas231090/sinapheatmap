import { useState, useEffect, useRef } from "react";
import { CALIBRATION_POINTS } from "@/utils/eyeTrackingMath";

/**
 * Etapa de Calibração — v2
 *
 * Principais melhorias em relação à versão anterior:
 *
 * 1. clearFrameBuffer entre pontos: ao avançar para o próximo ponto de
 *    calibração, o buffer de frames é limpo. Isso impede que frames onde o
 *    usuário ainda estava olhando para o ponto anterior (ou em transição)
 *    sejam rotulados com as coordenadas do novo ponto.
 *
 * 2. Trava de fixação (600 ms): após a troca de ponto, o botão fica
 *    desabilitado por 600 ms — tempo suficiente para o olhar se estabilizar
 *    e para o frameBuffer acumular apenas frames do novo ponto.
 *
 * 3. Feedback visual melhorado: anel de ripple indica quando o botão está
 *    pronto; flash verde confirma a coleta; barra de progresso mostra avanço.
 */
export default function NTestStepCalibration({
  faceValid,
  addCalibrationPoint,
  clearFrameBuffer,
  onFinishCalibration,
}) {
  const [step, setStep] = useState(0);
  const [canClick, setCanClick] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const timerRef = useRef(null);

  // Ao trocar de ponto: descarta frames antigos e exige fixação mínima
  useEffect(() => {
    setCanClick(false);
    setIsCollecting(false);
    clearFrameBuffer();

    clearTimeout(timerRef.current);
    // 600 ms: ~18 frames a 30 fps — frames suficientes do novo ponto no buffer
    timerRef.current = setTimeout(() => setCanClick(true), 600);

    return () => clearTimeout(timerRef.current);
  }, [step, clearFrameBuffer]);

  const handleClick = () => {
    if (!canClick || !faceValid || isCollecting) return;

    const pt = CALIBRATION_POINTS[step];
    setIsCollecting(true);
    addCalibrationPoint(pt.x, pt.y);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (step === CALIBRATION_POINTS.length - 1) {
        onFinishCalibration();
      } else {
        setStep((s) => s + 1);
      }
    }, 300); // Flash de confirmação antes de avançar
  };

  const point = CALIBRATION_POINTS[step];
  const progressPct = (step / CALIBRATION_POINTS.length) * 100;
  const isReady = canClick && faceValid && !isCollecting;

  // Mensagem de instrução contextual
  const instruction = isCollecting
    ? "Coletando dados…"
    : canClick
      ? "Olhe fixamente para o ponto azul e clique nele."
      : "Fixe o olhar no ponto azul…";

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-slate-950 text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 p-5 text-center">
        <p className="mb-3 font-bold text-white/80">
          {instruction}{" "}
          <span className="text-white/40">
            ({step + 1}/{CALIBRATION_POINTS.length})
          </span>
        </p>
        {/* Barra de progresso */}
        <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
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
      <button
        type="button"
        aria-label={`Ponto de calibração ${step + 1} de ${CALIBRATION_POINTS.length}`}
        onClick={handleClick}
        style={{
          position: "absolute",
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
        // Adicionado z-50 e cursor-pointer
        className="relative z-50 flex cursor-pointer items-center justify-center"
      >
        {/* Anel de ripple — sinaliza que o botão está pronto para clique */}
        {isReady && (
          <span className="absolute inline-flex size-10 animate-ping rounded-full bg-blue-400 opacity-50" />
        )}

        {/* Círculo principal */}
        <span
          className={`relative inline-flex size-8 rounded-full transition-all duration-300 ${
            isCollecting
              ? "scale-75 bg-green-400 shadow-[0_0_24px_8px_rgba(74,222,128,0.8)]"
              : isReady
                ? "bg-blue-500 shadow-[0_0_16px_5px_rgba(59,130,246,0.8)] hover:scale-110"
                : "bg-blue-900 opacity-50"
          }`}
        />
      </button>
    </div>
  );
}
