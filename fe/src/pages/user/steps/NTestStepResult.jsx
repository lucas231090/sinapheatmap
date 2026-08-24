import { useEffect, useReducer, useRef, useState } from "react";
import { createEyeTrackingSession } from "@/services/eyetrackingService";

// Global cache to prevent identical sessions from being submitted multiple times
// within the same browser session (e.g. from StrictMode or accidental remounts).
const submittedSessionsCache = new WeakSet();

export default function NTestStepResult({
  experimentId,
  participantInfo,
  sessionData,
}) {
  const [status, setStatus] = useReducer((state, action) => action, "saving"); // saving | success | error

  const [sessionId] = useState(() => crypto.randomUUID());

  // Flag de idempotência: impede submit duplicado em StrictMode
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    // Evita o reenvio se o array 'sessionData' já tiver sido salvo antes com sucesso
    if (sessionData && submittedSessionsCache.has(sessionData)) {
      setStatus("success");
      return;
    }

    // Proteção contra chamadas duplas no Strict Mode ou remounts rápidos
    if (hasSubmittedRef.current) return;

    async function submit() {
      try {
        hasSubmittedRef.current = true;

        const payload = {
          sessao_id: sessionId,
          experimento_id: experimentId,
          participante: {
            nome: participantInfo.nome || "",
            cpf: participantInfo.cpf || "",
          },
          amostras: sessionData,
        };

        await createEyeTrackingSession(payload);

        // Somente adiciona ao cache se tiver sucesso
        if (sessionData) {
          submittedSessionsCache.add(sessionData);
        }
        setStatus("success");
      } catch (err) {
        console.error("Erro ao salvar:", err);
        // Permite tentar novamente em caso de erro
        hasSubmittedRef.current = false;
        setStatus("error");
      }
    }
    submit();
  }, [experimentId, participantInfo, sessionData, sessionId]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-8 text-center text-white">
      {status === "saving" && (
        <div className="rounded-[2rem] border border-white/15 bg-slate-950/35 px-8 py-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold animate-pulse">
            Salvando seus resultados&hellip;
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
        <div className="animate-fade-in-up rounded-[2rem] border border-white/15 bg-slate-950/35 p-8 shadow-2xl backdrop-blur-md">
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

