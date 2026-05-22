import { useEffect, useState } from "react";
import { createEyeTrackingSession } from "@/services/eyetrackingService";

export default function NTestStepResult({
  experimentId,
  participantInfo,
  sessionData,
}) {
  const [status, setStatus] = useState("saving"); // saving | success | error

  useEffect(() => {
    async function submit() {
      try {
        const payload = {
          sessao_id: crypto.randomUUID(),
          experimento_id: experimentId,
          participante: {
            nome: participantInfo.nome || "",
            cpf: participantInfo.cpf || "",
          },
          amostras: sessionData,
        };

        await createEyeTrackingSession(payload);
        setStatus("success");
      } catch (err) {
        console.error("Erro ao salvar:", err);
        setStatus("error");
      }
    }
    submit();
  }, [experimentId, participantInfo, sessionData]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-8 text-center text-white">
      {status === "saving" && (
        <div className="rounded-[2rem] border border-white/15 bg-slate-950/35 px-8 py-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold animate-pulse">
            Salvando seus resultados...
          </h2>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-[2rem] border border-red-300/20 bg-red-950/30 px-8 py-6 text-red-200 shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-2">Ops, tivemos um problema!</h2>
          <p>
            Não foi possível enviar os dados da sua sessão. Comunique o
            pesquisador.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="animate-fade-in-up rounded-[2rem] border border-white/15 bg-slate-950/35 px-8 py-8 shadow-2xl backdrop-blur-md">
          <h1 className="mb-4 text-5xl font-black text-sinapgreen-200">
            MUITO OBRIGADO POR PARTICIPAR!
          </h1>
          <p className="mb-8 text-xl text-slate-200">
            Sua contribuição é essencial para nossa pesquisa.
          </p>

          <div className="inline-block rounded-2xl border border-white/10 bg-white/10 p-6">
            <p className="mb-2 text-sm uppercase tracking-widest text-slate-300">
              Acompanhe nosso trabalho
            </p>
            <a
              href="https://instagram.com/sinapsenseufpr"
              target="_blank"
              rel="noreferrer"
              className="text-2xl font-bold text-white transition hover:text-sinapgreen-200"
            >
              @sinapsenseufpr
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
