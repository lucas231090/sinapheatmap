import { useMemo, useState } from "react";
import {
  formatCpf,
  isValidCpf,
  normalizeCpf,
  participantMatchesAccess,
} from "@/utils/cpf";

export default function NTestStepWelcome({ experiment, onNext }) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ident = experiment?.identification || { mode: "nome", required: true };
  const participants = Array.isArray(experiment?.participants)
    ? experiment.participants
    : [];
  const hasParticipantAccessList = participants.length > 0;
  const askNome = ident.mode.includes("nome");
  const askCpf = ident.mode.includes("cpf");

  const normalizedCpf = useMemo(() => normalizeCpf(cpf), [cpf]);

  const handleCpfChange = (value) => {
    setCpf(formatCpf(value));
    setErrorMessage("");
  };

  const handleNomeChange = (value) => {
    setNome(value);
    setErrorMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (askNome && !nome.trim()) {
      setErrorMessage("Informe seu nome para continuar.");
      return;
    }

    if (askCpf && !normalizedCpf) {
      setErrorMessage("Informe seu CPF para continuar.");
      return;
    }

    if (askCpf && normalizedCpf && !isValidCpf(normalizedCpf)) {
      setErrorMessage("CPF inválido. Verifique os números informados.");
      return;
    }

    if (!ident.required) {
      onNext({ nome: "", cpf: "" });
      return;
    }

    if (hasParticipantAccessList) {
      const isAllowed = participants.some((participant) =>
        participantMatchesAccess(
          participant,
          { nome, cpf: normalizedCpf },
          ident.mode,
        ),
      );

      if (!isAllowed) {
        setErrorMessage(
          "Seu nome e CPF não estão na lista de participantes autorizados.",
        );
        return;
      }
    }

    onNext({ nome: nome.trim(), cpf: formatCpf(normalizedCpf) });
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center p-8 text-center text-white">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-[2rem] border border-white/15 bg-slate-950/35 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            {experiment.basic?.name}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
            {experiment.basic?.description}
          </p>
        </div>

        {!ident.required ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-200">
              Este teste não exige identificação. Você pode iniciar quando
              estiver pronto.
            </p>
            <button
              type="button"
              onClick={() => onNext({ nome: "", cpf: "" })}
              className="rounded-full bg-sinapgreen-500 px-8 py-3 font-bold text-black transition hover:bg-sinapgreen-400"
            >
              Iniciar Experimento
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md flex-col gap-4 rounded-[1.75rem] border border-white/15 bg-white p-6 text-black shadow-2xl"
          >
            {askNome && (
              <input
                type="text"
                aria-label="Seu nome completo"
                placeholder="Seu nome completo"
                required
                className="rounded-2xl border border-slate-200 p-3 outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-100"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
              />
            )}
            {askCpf && (
              <input
                type="text"
                aria-label="Seu CPF"
                placeholder="Seu CPF"
                required
                inputMode="numeric"
                className="rounded-2xl border border-slate-200 p-3 outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-100"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
              />
            )}

            {hasParticipantAccessList ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-700">
                A lista de participantes funciona como acesso ao experimento.
                Seu nome e CPF serão verificados antes de iniciar.
              </p>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-700">
                Você pode iniciar o experimento após preencher os dados
                solicitados.
              </p>
            )}

            {errorMessage ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="rounded-full bg-sinapgreen-500 p-3 font-bold text-black transition hover:bg-sinapgreen-400"
            >
              Iniciar Experimento
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
