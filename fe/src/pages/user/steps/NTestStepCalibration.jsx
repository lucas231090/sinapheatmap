import { useState } from "react";
import { CALIBRATION_POINTS } from "@/utils/eyeTrackingMath";

export default function NTestStepCalibration({
  faceValid,
  addCalibrationPoint,
  onFinishCalibration,
}) {
  const [step, setStep] = useState(0);

  const handleClick = () => {
    if (!faceValid) return alert("Volte para a câmera antes de clicar!");

    const pt = CALIBRATION_POINTS[step];
    addCalibrationPoint(pt.x, pt.y);

    if (step === CALIBRATION_POINTS.length - 1) {
      onFinishCalibration();
    } else {
      setStep((s) => s + 1);
    }
  };

  const point = CALIBRATION_POINTS[step];

  return (
    <div className="relative flex h-screen bg-black w-full items-center justify-center overflow-hidden p-8 text-white">
      <p className="absolute top-10 w-full text-center font-bold text-white/80">
        Olhe fixamente para a bolinha azul e clique nela. ({step + 1}/
        {CALIBRATION_POINTS.length})
      </p>

      {!faceValid && (
        <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-xl bg-red-500 p-4 text-white">
          Câmera perdeu seu rosto! Centralize-se novamente.
        </div>
      )}

      <button
        onClick={handleClick}
        style={{
          position: "absolute",
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
        className="h-10 w-10 cursor-pointer rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] transition-all"
      />
    </div>
  );
}
