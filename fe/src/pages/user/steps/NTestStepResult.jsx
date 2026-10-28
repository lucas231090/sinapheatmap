import { useEffect, useRef, useState, useCallback } from "react";
import { createEyeTrackingSession } from "@/services/eyetrackingService";

// Global cache to prevent identical sessions from being submitted multiple times
// within the same browser session (e.g. from StrictMode or accidental remounts).
const submittedSessionsCache = new WeakSet();

const generateSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export default function NTestStepResult({
  experimentId,
  sessionData,
  participantData,
}) {
  const [status, setStatus] = useState(() => {
    if (
      sessionData &&
      typeof sessionData === "object" &&
      submittedSessionsCache.has(sessionData)
    ) {
      return "success";
    }
    return "saving";
  }); // saving | success | error

  const [errorMessage, setErrorMessage] = useState("");
  const [sessionId] = useState(generateSessionId);

  // Armazena a Promise da requisição em andamento para não duplicar chamadas
  // e permitir que re-renderizações/remounts recuperem o resultado
  const inFlightPromiseRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSave = useCallback(() => {
    if (
      sessionData &&
      typeof sessionData === "object" &&
      submittedSessionsCache.has(sessionData)
    ) {
      setStatus("success");
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    if (!inFlightPromiseRef.current) {
      const payload = {
        sessao_id: sessionId,
        experimento_id: experimentId,
        amostras: sessionData,
        idade: participantData?.idade ?? null,
        genero: participantData?.genero ?? null,
      };

      inFlightPromiseRef.current = createEyeTrackingSession(payload);
    }

    inFlightPromiseRef.current
      .then(() => {
        if (sessionData && typeof sessionData === "object") {
          submittedSessionsCache.add(sessionData);
        }
        if (isMountedRef.current) {
          setStatus("success");
        }
      })
      .catch((err) => {
        console.error("Erro ao salvar sessão:", err);
        // Permite nova tentativa limpando a promessa que falhou
        inFlightPromiseRef.current = null;
        if (isMountedRef.current) {
          const message =
            err?.response?.data?.error ||
            err?.message ||
            "Não foi possível enviar os dados da sua sessão. Comunique o pesquisador.";
          setErrorMessage(message);
          setStatus("error");
        }
      });
  }, [sessionId, experimentId, sessionData, participantData]);

  useEffect(() => {
    handleSave();
  }, [handleSave]);

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
        <div className="max-w-lg rounded-[2rem] border border-red-300/20 bg-red-950/30 px-8 py-6 text-red-200 shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-2">Ops, tivemos um problema!</h2>
          <p className="mb-2">
            Não foi possível enviar os dados da sua sessão. Comunique o
            pesquisador.
          </p>
          {errorMessage && (
            <p className="mb-4 text-xs text-red-300/80 font-mono">
              Detalhes: {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-red-500 hover:bg-red-400 px-6 py-2.5 font-bold text-white transition shadow-lg cursor-pointer"
          >
            Tentar novamente
          </button>
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
