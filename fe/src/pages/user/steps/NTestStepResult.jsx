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
    <div className="w-full h-full bg-[#1e293b] flex flex-col items-center justify-center text-center p-8">
      {status === "saving" && (
        <h2 className="text-2xl font-bold animate-pulse">
          Salvando seus resultados...
        </h2>
      )}

      {status === "error" && (
        <div className="text-red-400">
          <h2 className="text-2xl font-bold mb-2">Ops, tivemos um problema!</h2>
          <p>
            Não foi possível enviar os dados da sua sessão. Comunique o
            pesquisador.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="animate-fade-in-up">
          <h1 className="text-5xl font-black text-[#00C8E6] mb-4">
            MUITO OBRIGADO POR PARTICIPAR!
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Sua contribuição é essencial para nossa pesquisa.
          </p>

          <div className="inline-block bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-sm uppercase tracking-widest text-slate-400 mb-2">
              Acompanhe nosso trabalho
            </p>
            <a
              href="https://instagram.com/sinapsenseufpr"
              target="_blank"
              rel="noreferrer"
              className="text-2xl font-bold text-white hover:text-[#00C8E6] transition"
            >
              @sinapsenseufpr
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
