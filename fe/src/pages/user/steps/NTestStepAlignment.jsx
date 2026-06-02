import { useEffect, useState, useRef } from "react";

export default function NTestStepAlignment({
  stream,
  mpLoaded,
  startCamera,
  cameraActive,
  faceValid,
  onNext,
}) {
  const [rawTimeValid, setRawTimeValid] = useState(0);
  const prevFaceValid = useRef(faceValid);

  if (faceValid !== prevFaceValid.current) {
    prevFaceValid.current = faceValid;
    setRawTimeValid(0);
  }

  const timeValid = faceValid ? rawTimeValid : 0;
  const displayVideoRef = useRef(null);

  useEffect(() => {
    if (displayVideoRef.current && stream) {
      displayVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!faceValid) return;
    const timer = setInterval(() => setRawTimeValid((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [faceValid]);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center p-8 text-center text-white">
      <div className="w-full max-w-4xl rounded-[2rem] bg-slate-950/35 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <h2 className="mb-2 text-2xl font-bold">Alinhamento da Câmera</h2>
        <p className="mx-auto mb-8 max-w-lg text-slate-300">
          Posicione seu rosto dentro da marcação virtual. Certifique-se de estar
          em um ambiente iluminado.
        </p>

        <div className="mx-auto mb-8 flex w-full max-w-3xl flex-col items-center gap-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/70 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
            <video
              ref={displayVideoRef} // Usando a ref local de exibição
              autoPlay
              playsInline
              muted
              aria-label="Exibição da câmera"
              className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                cameraActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <track kind="captions" />
            </video>

            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-sm text-slate-300">
                A câmera aparecerá aqui após ativá-la.
              </div>
            )}

            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="h-[70%] w-[50%] rounded-full border-4 border-red-500/90 transition-colors">
                  <div
                    className={`h-full w-full rounded-full border-4 transition-colors ${
                      faceValid ? "border-green-500/90" : "border-red-500/90"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={!mpLoaded}
              className="rounded-full bg-sinapgreen-500 px-6 py-3 font-bold text-black disabled:opacity-50"
            >
              {mpLoaded ? "Ativar Câmera" : "Carregando Modelos..."}
            </button>
          ) : null}
        </div>

        {timeValid > 2 && (
          <button
            type="button"
            onClick={onNext}
            className="mt-2 rounded-full bg-green-500 px-8 py-4 font-bold text-white transition-transform ease-out hover:scale-105"
          >
            Posição Perfeita! Continuar
          </button>
        )}
      </div>
    </div>
  );
}
