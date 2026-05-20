import { useEffect, useState } from "react";

export default function NTestStepAlignment({
  mpLoaded,
  startCamera,
  cameraActive,
  faceValid,
  onNext,
}) {
  const [timeValid, setTimeValid] = useState(0);

  // Conta o tempo que o rosto está válido para liberar o botão
  useEffect(() => {
    let timer;
    if (faceValid) {
      timer = setInterval(() => setTimeValid((t) => t + 1), 1000);
    } else {
      setTimeValid(0);
    }
    return () => clearInterval(timer);
  }, [faceValid]);

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center pt-10">
      <h2 className="text-2xl font-bold mb-2">Alinhamento da Câmera</h2>
      <p className="text-slate-400 mb-8 max-w-lg text-center">
        Posicione seu rosto dentro da marcação virtual. Certifique-se de estar
        em um ambiente iluminado.
      </p>

      {!cameraActive && (
        <button
          onClick={startCamera}
          disabled={!mpLoaded}
          className="px-6 py-3 bg-sinapgreen-800 rounded-full font-bold mt-20 disabled:opacity-50"
        >
          {mpLoaded ? "Ativar Câmera" : "Carregando Modelos..."}
        </button>
      )}

      {/* Overlay guia da face em cima da tag video original */}
      {cameraActive && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[640px] h-[480px] pointer-events-none z-[1000]">
          <div
            className={`absolute top-[15%] left-[25%] w-[50%] h-[70%] border-4 rounded-full transition-colors ${
              faceValid ? "border-green-500" : "border-red-500"
            }`}
          />
        </div>
      )}

      {timeValid > 2 && (
        <button
          onClick={onNext}
          className="absolute bottom-10 px-8 py-4 bg-green-500 text-white font-bold rounded-full animate-bounce z-[1001]"
        >
          Posição Perfeita! Continuar
        </button>
      )}
    </div>
  );
}
