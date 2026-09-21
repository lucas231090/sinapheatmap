export default function NTestStepWelcome({ experiment, onNext }) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center p-8 text-center text-white">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-[2rem] border border-white/15 bg-slate-950/35 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            {experiment?.basic?.name || "Experimento"}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
            {experiment?.basic?.description}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-200">
            Este teste é anônimo e não exige identificação. Você pode iniciar
            quando estiver pronto.
          </p>
          <button
            type="button"
            onClick={() => onNext()}
            className="rounded-full bg-sinapgreen-500 px-8 py-3 font-bold text-black transition hover:bg-sinapgreen-400"
          >
            Iniciar Experimento
          </button>
        </div>
      </div>
    </div>
  );
}
