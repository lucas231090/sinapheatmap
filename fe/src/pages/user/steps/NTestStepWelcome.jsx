import { useState } from "react";

export default function NTestStepWelcome({ experiment, onNext }) {
  const requireAge = Boolean(
    experiment?.basic?.requireAge || experiment?.requireAge,
  );
  const requireGender = Boolean(
    experiment?.basic?.requireGender || experiment?.requireGender,
  );

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [customGender, setCustomGender] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleStart = () => {
    setErrorMsg("");

    if (requireAge) {
      const parsedAge = Number(age);
      if (!age || !Number.isInteger(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
        setErrorMsg("Por favor, informe uma idade válida (entre 1 e 120 anos).");
        return;
      }
    }

    if (requireGender) {
      if (!gender.trim()) {
        setErrorMsg("Por favor, selecione seu gênero.");
        return;
      }
      if (gender === "Outro" && !customGender.trim()) {
        setErrorMsg("Por favor, informe com qual gênero você se identifica.");
        return;
      }
    }

    const resolvedGender = requireGender
      ? gender === "Outro"
        ? customGender.trim()
        : gender.trim()
      : null;

    onNext({
      idade: requireAge ? Number(age) : null,
      genero: resolvedGender,
    });
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center p-8 text-center text-white">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-white/15 bg-slate-950/45 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            {experiment?.basic?.name || "Experimento"}
          </h1>
          {experiment?.basic?.description && (
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              {experiment.basic.description}
            </p>
          )}
        </div>

        {/* Formulário de Identificação Prévia (se exigido pelo teste) */}
        {(requireAge || requireGender) && (
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <p className="text-center text-sm font-semibold text-slate-200">
              Antes de começar, precisamos de algumas informações básicas:
            </p>

            <div className="grid gap-4">
              {requireAge && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="participant-age"
                    className="text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Qual é sua idade? *
                  </label>
                  <input
                    id="participant-age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Ex: 25"
                    className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-sinapgreen-500 focus:ring-1 focus:ring-sinapgreen-500"
                  />
                </div>
              )}

              {requireGender && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="participant-gender"
                    className="text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Qual gênero você se identifica? *
                  </label>
                  <select
                    id="participant-gender"
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (e.target.value !== "Outro") {
                        setCustomGender("");
                      }
                      setErrorMsg("");
                    }}
                    className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-4 py-2.5 text-white outline-none transition focus:border-sinapgreen-500 focus:ring-1 focus:ring-sinapgreen-500"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      Selecione uma opção
                    </option>
                    <option value="Feminino" className="bg-slate-900 text-white">
                      Feminino
                    </option>
                    <option value="Masculino" className="bg-slate-900 text-white">
                      Masculino
                    </option>
                    <option value="Não-binário" className="bg-slate-900 text-white">
                      Não-binário
                    </option>
                    <option value="Outro" className="bg-slate-900 text-white">
                      Outro
                    </option>
                  </select>

                  {gender === "Outro" && (
                    <div className="flex flex-col gap-1.5 pt-2">
                      <label
                        htmlFor="participant-custom-gender"
                        className="text-xs font-bold uppercase tracking-wider text-slate-300"
                      >
                        Qual gênero você se identifica? *
                      </label>
                      <input
                        id="participant-custom-gender"
                        type="text"
                        value={customGender}
                        onChange={(e) => {
                          setCustomGender(e.target.value);
                          setErrorMsg("");
                        }}
                        placeholder="Escreva qual gênero você se identifica"
                        className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-sinapgreen-500 focus:ring-1 focus:ring-sinapgreen-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-500/20 px-3 py-2 text-center text-xs font-medium text-red-300 border border-red-500/30">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {!requireAge && !requireGender && (
            <p className="text-sm text-slate-200">
              Este teste é anônimo e não exige identificação. Você pode iniciar quando estiver pronto.
            </p>
          )}

          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-sinapgreen-500 px-8 py-3 font-bold text-black transition hover:bg-sinapgreen-400 cursor-pointer shadow-lg hover:shadow-sinapgreen-500/20"
          >
            Iniciar Experimento
          </button>
        </div>
      </div>
    </div>
  );
}
