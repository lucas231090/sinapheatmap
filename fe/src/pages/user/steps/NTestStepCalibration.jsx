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
    <div className="w-full h-full bg-white relative overflow-hidden">
      <p className="absolute top-10 w-full text-center text-slate-500 font-bold">
        Olhe fixamente para a bolinha azul e clique nela. ({step + 1}/
        {CALIBRATION_POINTS.length})
      </p>

      {!faceValid && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded-xl z-50 animate-pulse">
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
        className="w-10 h-10 bg-blue-600 rounded-full cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.8)] transition-all"
      />
    </div>
  );
}
