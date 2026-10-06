import { useState } from "react";

export default function NTestStepWelcome({ experiment, onNext }) {
  const participantData = experiment?.participantData || {};
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

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

        <div className="w-full max-w-xl space-y-4">
          <p className="text-sm text-slate-200">
            Este teste é anônimo e não solicita nome ou CPF. Você pode iniciar
            quando estiver pronto.
          </p>
          {(participantData.collectAge || participantData.collectGender) && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left sm:grid-cols-2">
              {participantData.collectAge && (
                <label className="text-sm text-slate-200">
                  Idade (opcional)
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white"
                  />
                </label>
              )}
              {participantData.collectGender && (
                <label className="text-sm text-slate-200">
                  Genero (opcional)
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-white"
                  >
                    <option value="">Prefiro nao informar</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="nao-binario">Nao binario</option>
                    <option value="outro">Outro</option>
                  </select>
                </label>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onNext({ age: age || null, gender: gender || null })}
            className="rounded-full bg-sinapgreen-500 px-8 py-3 font-bold text-black transition hover:bg-sinapgreen-400"
          >
            Iniciar Experimento
          </button>
        </div>
      </div>
    </div>
  );
}
