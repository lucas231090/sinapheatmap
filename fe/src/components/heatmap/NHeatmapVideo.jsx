import { useCallback, useMemo, useRef, useState } from "react";
import api from "@/services/api";
import { Player } from "@remotion/player";
import { HeatmapComposition } from "./HeatmapComposition";
import SpeedIcon from "@mui/icons-material/Speed";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import AdjustIcon from "@mui/icons-material/Adjust";
import GrainIcon from "@mui/icons-material/Grain";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";

const NHeatmapVideoControls = ({
  heatmapVisible,
  setHeatmapVisible,
  bubblesVisible,
  setBubblesVisible,
  gazePlotVisible,
  setGazePlotVisible,
  heatmapOnlyBubbles,
  setHeatmapOnlyBubbles,
  fadeModeVisible,
  setFadeModeVisible,
  playbackSpeed,
  handleSpeedChange,
  estimatedCaptureFps,
  coordsLength,
  handleDownloadVideo,
  isRecording,
  hasNormalizedCoords,
}) => (
  <div className="mb-4 flex w-full flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 p-4 shadow-sm lg:flex-row">
    {/* Visualization toggles */}
    <aside className="flex flex-row gap-3 lg:w-auto lg:flex-row lg:gap-3 flex-wrap sm:flex-nowrap">
      <label
        className={`group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
          heatmapVisible
            ? "border-sinapgreen-500 bg-sinapgreen-500 text-black shadow-sm"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        title={heatmapVisible ? "Ocultar heatmap" : "Mostrar heatmap"}
      >
        <input
          type="checkbox"
          checked={heatmapVisible}
          onChange={(e) => setHeatmapVisible(e.target.checked)}
          className="peer sr-only"
        />
        <span className="flex size-8 items-center justify-center rounded-xl text-current transition group-hover:scale-105 peer-checked:text-black">
          {heatmapVisible ? (
            <VisibilityIcon fontSize="small" />
          ) : (
            <VisibilityOffIcon fontSize="small" />
          )}
        </span>
      </label>

      <label
        className={`group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
          bubblesVisible
            ? "border-sinapgreen-500 bg-sinapgreen-500 text-black shadow-sm"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        title={bubblesVisible ? "Ocultar bolhas" : "Mostrar bolhas"}
      >
        <input
          type="checkbox"
          checked={bubblesVisible}
          onChange={(e) => setBubblesVisible(e.target.checked)}
          className="peer sr-only"
        />
        <span className="flex size-8 items-center justify-center rounded-xl text-current transition group-hover:scale-105 peer-checked:text-black">
          <CircleOutlinedIcon fontSize="small" />
        </span>
      </label>

      <label
        className={`group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
          gazePlotVisible
            ? "border-sinapgreen-500 bg-sinapgreen-500 text-black shadow-sm"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        title={gazePlotVisible ? "Ocultar fixações" : "Mostrar fixações"}
      >
        <input
          type="checkbox"
          checked={gazePlotVisible}
          onChange={(e) => setGazePlotVisible(e.target.checked)}
          className="peer sr-only"
        />
        <span className="flex size-8 items-center justify-center rounded-xl text-current transition group-hover:scale-105 peer-checked:text-black">
          <AdjustIcon fontSize="small" />
        </span>
      </label>

      <label
        className={`group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
          heatmapOnlyBubbles
            ? "border-sinapgreen-500 bg-sinapgreen-500 text-black shadow-sm"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        title={heatmapOnlyBubbles ? "Heatmap com rastro" : "Heatmap apenas nos pontos (sem rastro)"}
      >
        <input
          type="checkbox"
          checked={heatmapOnlyBubbles}
          onChange={(e) => setHeatmapOnlyBubbles(e.target.checked)}
          className="peer sr-only"
        />
        <span className="flex size-8 items-center justify-center rounded-xl text-current transition group-hover:scale-105 peer-checked:text-black">
          <GrainIcon fontSize="small" />
        </span>
      </label>

      <label
        className={`group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
          fadeModeVisible
            ? "border-sinapgreen-500 bg-sinapgreen-500 text-black shadow-sm"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        title={fadeModeVisible ? "Desativar Fade" : "Fade ao longo do tempo (Rastro de 3s)"}
      >
        <input
          type="checkbox"
          checked={fadeModeVisible}
          onChange={(e) => setFadeModeVisible(e.target.checked)}
          className="peer sr-only"
        />
        <span className="flex size-8 items-center justify-center rounded-xl text-current transition group-hover:scale-105 peer-checked:text-black">
          <HistoryIcon fontSize="small" />
        </span>
      </label>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-slate-200 dark:bg-slate-600 self-stretch" />
    </aside>

    {/* Speed + info */}
    <div className="flex flex-1 flex-wrap items-center justify-center gap-4 text-black dark:text-white">
      <label
        className="flex items-center gap-2 text-black dark:text-white"
        htmlFor="select-speed"
      >
        <SpeedIcon fontSize="small" />
        <span className="text-sm font-semibold">Velocidade:</span>
      </label>
      <select
        id="select-speed"
        value={playbackSpeed}
        onChange={handleSpeedChange}
        className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 p-2 text-black dark:text-white outline-none focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-500/20"
      >
        <option value="0.5">0.5x</option>
        <option value="1">1x (Normal)</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
        <option value="4">4x</option>
      </select>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Coleta estimada: {estimatedCaptureFps} fps
        </span>
        {coordsLength === 0 && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Nenhum dado de rastreio para este vídeo
          </span>
        )}
      </div>
    </div>

    {/* Download button */}
    <button
      type="button"
      onClick={handleDownloadVideo}
      disabled={isRecording || !hasNormalizedCoords}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${
        isRecording
          ? "border-amber-400 bg-amber-400/20 text-amber-600 dark:text-amber-300 cursor-wait"
          : "border-sinapgreen-500 bg-sinapgreen-500 text-black hover:bg-sinapgreen-600"
      }`}
      title={isRecording ? "Gravando..." : "Baixar vídeo"}
    >
      <DownloadIcon fontSize="small" />
      {isRecording ? (
        <span className="text-sm">Gerando...</span>
      ) : (
        <span className="text-sm hidden sm:inline">Baixar</span>
      )}
    </button>
  </div>
);



export default function NHeatmapVideo({
  experimentId,
  coords,
  coordsBySession,
  canvasSize,
  radiusScale,
  mediaUrl,
  exposureSeconds,
  captureFps,
  durationMs,
  selectedSessionId,
  imageDisplayMode,
}) {
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Visualization mode toggles
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [bubblesVisible, setBubblesVisible] = useState(false);
  const [gazePlotVisible, setGazePlotVisible] = useState(false);
  const [heatmapOnlyBubbles, setHeatmapOnlyBubbles] = useState(false);
  const [fadeModeVisible, setFadeModeVisible] = useState(false);

  // Download state
  const [isRecording, setIsRecording] = useState(false);

  // FPS travado em 60 para bater exatamente com a taxa de atualização da webcam
  const FPS = 60;

  const parsedExposureSeconds = useMemo(() => {
    const value = Number.parseFloat(exposureSeconds);
    return Number.isFinite(value) && value > 0 ? value : 10;
  }, [exposureSeconds]);

  const estimatedCaptureFps = useMemo(() => {
    const value = Number(captureFps);
    if (Number.isFinite(value) && value > 0) return Math.round(value);

    const timestamps = (coords || []).reduce((acc, coord) => {
      const timestamp = Number(coord?.timestamp);
      if (Number.isFinite(timestamp)) acc.push(timestamp);
      return acc;
    }, []);

    if (timestamps.length < 2) return FPS;

    const deltas = [];
    for (let index = 1; index < timestamps.length; index += 1) {
      const delta = timestamps[index] - timestamps[index - 1];
      if (delta > 0) deltas.push(delta);
    }

    if (deltas.length === 0) return FPS;
    deltas.sort((a, b) => a - b);
    const medianDelta = deltas[Math.floor(deltas.length / 2)];
    return medianDelta > 0 ? Math.round(1000 / medianDelta) : FPS;
  }, [captureFps, coords]);

  // Normaliza os dados garantindo que todos tenham timestamp (compatibilidade com testes antigos)
  const normalizedCoords = useMemo(() => {
    return (coords || []).map((c, i) => ({
      ...c,
      // Se não tiver timestamp, simula um intervalo de 60Hz (~16.6ms)
      timestamp:
        c.timestamp !== undefined
          ? c.timestamp
          : i * (1000 / estimatedCaptureFps),
    }));
  }, [coords, estimatedCaptureFps]);

  const parsedDurationMs = Number(durationMs);
  const effectiveDurationMs =
    Number.isFinite(parsedDurationMs) && parsedDurationMs > 0
      ? parsedDurationMs
      : parsedExposureSeconds * 1000;

  // A duração visual deve seguir o tempo configurado do estímulo, não o último ponto capturado.
  const totalFrames = Math.max(
    Math.ceil((effectiveDurationMs / 1000) * FPS) + FPS,
    150,
  );

  const width = parseInt(canvasSize.width, 10) || 1280;
  const height = parseInt(canvasSize.height, 10) || 720;

  const heatmapData = useMemo(() => ({
    coords: normalizedCoords,
    radiusScale: radiusScale || 1,
    canvasSize: { width, height },
    exposureSeconds: parsedExposureSeconds,
    durationMs: effectiveDurationMs,
    captureFps: estimatedCaptureFps,
  }), [normalizedCoords, radiusScale, width, height, parsedExposureSeconds, effectiveDurationMs, estimatedCaptureFps]);

  const resolvedMediaUrl = mediaUrl || "";

  const handleSpeedChange = (e) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  };

  const isVideoFile = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl || "");
  const mediaType = isVideoFile ? 1 : 0;

  const modes = useMemo(() => ({
    heatmap: heatmapVisible,
    bubbles: bubblesVisible,
    gazePlot: gazePlotVisible,
    heatmapOnlyBubbles: heatmapOnlyBubbles,
    fadeModeVisible: fadeModeVisible,
  }), [heatmapVisible, bubblesVisible, gazePlotVisible, heatmapOnlyBubbles, fadeModeVisible]);

  // Download video processado no Back-end (Remotion API)
  const handleDownloadVideo = useCallback(async () => {
    setIsRecording(true);

    try {
      const response = await api.post(
        "/video/export",
        {
          coords,
          coordsBySession,
          canvasSize,
          radiusScale,
          mediaUrl,
          exposureSeconds,
          captureFps,
          durationMs,
          selectedSessionId,
          heatmapVisible,
          bubblesVisible,
          gazePlotVisible,
          heatmapOnlyBubbles,
          fadeModeVisible,
          imageDisplayMode,
        },
        {
          responseType: "blob", // Importante para receber o arquivo de vídeo
        }
      );

      // Cria um link temporário para forçar o download do Blob
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `heatmap-video-${Date.now()}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar vídeo no backend:", error);
      alert("Ocorreu um erro ao renderizar o vídeo. Tente novamente.");
    } finally {
      setIsRecording(false);
    }
  }, [
    coords,
    coordsBySession,
    canvasSize,
    radiusScale,
    mediaUrl,
    exposureSeconds,
    captureFps,
    durationMs,
    selectedSessionId,
    heatmapVisible,
    bubblesVisible,
    gazePlotVisible,
    heatmapOnlyBubbles,
    fadeModeVisible,
  ]);

  return (
    <div className="flex w-full flex-col items-center">
      <NHeatmapVideoControls
        heatmapVisible={heatmapVisible}
        setHeatmapVisible={setHeatmapVisible}
        bubblesVisible={bubblesVisible}
        setBubblesVisible={setBubblesVisible}
        gazePlotVisible={gazePlotVisible}
        setGazePlotVisible={setGazePlotVisible}
        heatmapOnlyBubbles={heatmapOnlyBubbles}
        setHeatmapOnlyBubbles={setHeatmapOnlyBubbles}
        fadeModeVisible={fadeModeVisible}
        setFadeModeVisible={setFadeModeVisible}
        playbackSpeed={playbackSpeed}
        handleSpeedChange={handleSpeedChange}
        estimatedCaptureFps={estimatedCaptureFps}
        coordsLength={coords.length}
        handleDownloadVideo={handleDownloadVideo}
        isRecording={isRecording}
        hasNormalizedCoords={normalizedCoords.length > 0}
      />

      {/* Player */}
      <div
        ref={playerContainerRef}
        className="relative flex w-full max-w-[1280px] flex-col items-center rounded-[1.5rem] border border-slate-200 bg-white dark:bg-slate-800 p-4 shadow-sm overflow-hidden min-h-[400px]"
      >
        {heatmapData.coords && heatmapData.coords.length > 0 ? (
          <Player
            ref={playerRef}
            component={HeatmapComposition}
            durationInFrames={totalFrames}
            fps={FPS}
            compositionWidth={width}
            compositionHeight={height}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "70vh",
              aspectRatio: `${width} / ${height}`,
            }}
            controls={true}
            inputProps={{
              heatmapData,
              img: resolvedMediaUrl,
              type: mediaType,
              modes,
              coordsBySession: coordsBySession || [],
              selectedSessionId: selectedSessionId || "all",
              imageDisplayMode,
            }}
            autoPlay={false}
            clickToPlay={true}
            loop={false}
            doubleClickToFullscreen={true}
            playbackRate={playbackSpeed}
            acknowledgeRemotionLicense
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white bg-slate-950 dark:bg-slate-700 rounded-2xl p-6">
            <h3 className="text-xl mb-4">Aguardando dados&hellip;</h3>
          </div>
        )}

        {/* Recording indicator — não oculta o player (real-time capture precisa dele visível) */}
        {isRecording && (
          <>
            {/* Pointer-events blocker para impedir interação durante gravação */}
            <div className="absolute inset-0 z-40" style={{ pointerEvents: "all" }} />
            {/* Banner de gravação no topo */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-red-600/90 px-5 py-2 shadow-lg backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="text-sm font-semibold text-white">
                Renderizando vídeo no servidor...
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NHeatmapVideo;
