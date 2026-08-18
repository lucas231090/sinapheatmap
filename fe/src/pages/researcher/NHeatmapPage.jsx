import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useHeatmapData } from "@/hooks/useHeatmapData";
import NHeatmapStatic from "@/components/heatmap/NHeatmapStatic";
import NHeatmapVideo from "@/components/heatmap/NHeatmapVideo";
import { getPublicMediaUrl } from "@/services/api";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import NPageHeader from "@/components/general/NPageHeader";

const normalizeMediaUrl = (value) => getPublicMediaUrl(value || "");

function NHeatmapPage() {
  const { id } = useParams();
  const [forceVideoHeatmap, setForceVideoHeatmap] = useState(false);
  const {
    experiment,
    sessions,
    isLoading,
    error,
    activePiece,
    selectedSampleId,
    setSelectedSampleId,
    selectedPieceId,
    setSelectedPieceId,
    selectedSessionId,
    setSelectedSessionId,
    coords,
    coordsBySession,
    radiusScale,
    canvasSize,
    captureFps,
    timelineDurationMs,
  } = useHeatmapData(id);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center bg-white dark:bg-slate-800 text-black dark:text-white">
        <div className="flex h-[50vh] flex-col items-center justify-center">
          <p className="mt-4 text-lg">Carregando dados do heatmap&hellip;</p>
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 pt-20 text-center text-black dark:text-white">
        <h2 className="text-2xl font-bold text-red-600">Erro</h2>
        <p className="mt-2 text-black/80 dark:text-slate-400">
          {error || "Experimento não encontrado"}
        </p>
        <Link
          to="/home"
          className="mt-6 rounded-full bg-sinapgreen-500 px-6 py-2 font-bold text-black transition hover:bg-sinapgreen-600"
        >
          Voltar para Home
        </Link>
      </div>
    );
  }

  const isOldImported = Array.isArray(experiment?.jsonData);
  const isImported = experiment.jsonData?.basic?.isImported || isOldImported;
  const samples =
    experiment.jsonData?.samples || experiment.experiment?.samples || [];
  const pieces =
    experiment.jsonData?.pieces || experiment.experiment?.pieces || [];

  const availablePieces = isOldImported
    ? pieces
    : pieces.filter((p) => p.sampleId === selectedSampleId);

  let mediaUrl = "";
  if (activePiece?.previewUrl) {
    mediaUrl = normalizeMediaUrl(activePiece.previewUrl);
  } else if (activePiece?.mediaUrl) {
    mediaUrl = normalizeMediaUrl(activePiece.mediaUrl);
  } else if (activePiece?.sourceUrl) {
    mediaUrl = normalizeMediaUrl(activePiece.sourceUrl);
  } else if (activePiece?.mediaPath) {
    mediaUrl = normalizeMediaUrl(activePiece.mediaPath);
  } else if (experiment?.mediaPath) {
    mediaUrl = normalizeMediaUrl(experiment.mediaPath);
  }

  const isVideo = activePiece?.previewKind === "video" || forceVideoHeatmap;

  return (
    <div className="flex w-full flex-col gap-10 text-black dark:text-white">
      <NPageHeader
        title={`Heatmap: ${
          experiment.jsonData?.basic?.name ||
          experiment.filename ||
          "Sem título"
        }`}
        description={
          isImported ? "Experimento Importado" : "Experimento Criado"
        }
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_auto] lg:items-end">
          {!isOldImported && samples.length > 0 && (
            <div className="min-w-0">
              <label
                className="mb-2 block text-sm font-semibold text-black dark:text-white"
                htmlFor="select-sample"
              >
                Selecione a Amostra
              </label>
              <select
                id="select-sample"
                value={selectedSampleId}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-3 text-black dark:text-white outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-500/20"
              >
                {samples.map((s, index) => (
                  <option key={s.id} value={s.id}>
                    {s.name || `Amostra ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(availablePieces.length > 0 || isOldImported) && (
            <div className="min-w-0">
              <label
                className="mb-2 block text-sm font-semibold text-black dark:text-white"
                htmlFor="select-piece"
              >
                Selecione a Peça (Mídia)
              </label>
              <select
                id="select-piece"
                value={selectedPieceId}
                onChange={(e) => setSelectedPieceId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-3 text-black dark:text-white outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-500/20"
              >
                {isOldImported ? (
                  <option value="old-media">Mídia Importada</option>
                ) : (
                  availablePieces.map((p, index) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.sourceLabel || `Peça ${index + 1}`} (
                      {p.previewKind})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="min-w-0">
            <label
              className="mb-2 block text-sm font-semibold text-black dark:text-white"
              htmlFor="select-session"
            >
              Selecione o Participante (Sessão)
            </label>
            <select
              id="select-session"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-3 text-black dark:text-white outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-500/20"
            >
              <option value="all">Todos os Participantes Agrupados</option>
              {sessions.map((s) => {
                const sessionId = s.sessao_id || s.sessionId || s._id || s.id;
                const participantName =
                  s.participante?.nome ||
                  s.participant?.nome ||
                  s.participant?.name ||
                  "Anônimo";
                return (
                  <option key={sessionId} value={sessionId}>
                    {participantName} ({String(sessionId).substring(0, 8)}...)
                  </option>
                );
              })}
            </select>
          </div>

          {activePiece && activePiece.previewKind !== "video" && (
            <button
              type="button"
              onClick={() => setForceVideoHeatmap((current) => !current)}
              className="inline-flex h-full min-h-[58px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              {forceVideoHeatmap ? (
                <>
                  <ImageOutlinedIcon fontSize="small" />
                  Mudar para estático
                </>
              ) : (
                <>
                  <MovieOutlinedIcon fontSize="small" />
                  Mudar para vídeo
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center">
        {!activePiece ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white dark:bg-slate-800 px-6 py-8 text-center text-black dark:text-white">
            <p className="font-semibold text-black/80">
              Nenhuma peça disponível para este teste.
            </p>
          </div>
        ) : isVideo ? (
          <NHeatmapVideo
            experimentId={id}
            coords={coords}
            coordsBySession={coordsBySession}
            canvasSize={canvasSize}
            radiusScale={radiusScale}
            mediaUrl={mediaUrl}
            exposureSeconds={activePiece.exposureSeconds}
            captureFps={captureFps}
            durationMs={timelineDurationMs}
            selectedSessionId={selectedSessionId}
          />
        ) : (
          <NHeatmapStatic
            experimentId={id}
            coords={coords}
            coordsBySession={coordsBySession}
            canvasSize={canvasSize}
            radiusScale={radiusScale}
            mediaUrl={mediaUrl}
            selectedSessionId={selectedSessionId}
          />
        )}
      </div>
    </div>
  );
}

export default NHeatmapPage;
