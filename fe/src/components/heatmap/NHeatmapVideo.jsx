import { useCallback, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { HeatmapComposition } from "./HeatmapComposition";
import SpeedIcon from "@mui/icons-material/Speed";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import AdjustIcon from "@mui/icons-material/Adjust";
import DownloadIcon from "@mui/icons-material/Download";

const NHeatmapVideo = ({
  coords,
  coordsBySession,
  canvasSize,
  radiusScale,
  mediaUrl,
  exposureSeconds,
  captureFps,
  durationMs,
  selectedSessionId,
}) => {
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Visualization mode toggles
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [bubblesVisible, setBubblesVisible] = useState(false);
  const [gazePlotVisible, setGazePlotVisible] = useState(false);

  // Download state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

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
  const normalizedCoords = (coords || []).map((c, i) => ({
    ...c,
    // Se não tiver timestamp, simula um intervalo de 60Hz (~16.6ms)
    timestamp:
      c.timestamp !== undefined
        ? c.timestamp
        : i * (1000 / estimatedCaptureFps),
  }));

  const parsedDurationMs = Number(durationMs);
  const effectiveDurationMs =
    Number.isFinite(parsedDurationMs) && parsedDurationMs > 0
      ? parsedDurationMs
      : parsedExposureSeconds * 1000;

  // A duração visual deve seguir o tempo configurado do estímulo, não o último ponto capturado.
  const totalFrames = Math.max(
    Math.ceil((effectiveDurationMs / 1000) * estimatedCaptureFps) +
      estimatedCaptureFps,
    150,
  );

  const width = parseInt(canvasSize.width, 10) || 1280;
  const height = parseInt(canvasSize.height, 10) || 720;

  const heatmapData = {
    coords: normalizedCoords,
    radiusScale: radiusScale || 1,
    canvasSize: { width, height },
    exposureSeconds: parsedExposureSeconds,
    durationMs: effectiveDurationMs,
    captureFps: estimatedCaptureFps,
  };

  const resolvedMediaUrl = mediaUrl || "";

  const handleSpeedChange = (e) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  };

  const isVideoFile = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl || "");
  const mediaType = isVideoFile ? 1 : 0;

  const modes = {
    heatmap: heatmapVisible,
    bubbles: bubblesVisible,
    gazePlot: gazePlotVisible,
  };

  // Download video via gravação em tempo real (Real-time playback capture)
  // A estratégia é: reproduzir o vídeo normalmente a 1x e gravar o canvas composto em tempo real.
  // Isso evita artefatos visuais causados por seek frame-a-frame.
  const handleDownloadVideo = useCallback(async () => {
    const player = playerRef.current;
    const container = playerContainerRef.current;
    if (!player || !container) return;

    setIsRecording(true);
    setRecordingProgress(0);

    try {
      // Localiza o container de renderização do Remotion Player
      const playerElement =
        container.querySelector("[data-remotion-player-container]") ||
        container.querySelector("div");

      if (!playerElement) {
        console.error("Could not find player container element");
        setIsRecording(false);
        return;
      }

      // Canvas de composição off-screen (nunca exibido ao usuário)
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = width;
      compositeCanvas.height = height;
      const ctx = compositeCanvas.getContext("2d");

      // Configura MediaRecorder no stream do canvas de composição
      const CAPTURE_FPS = 30;
      const stream = compositeCanvas.captureStream(CAPTURE_FPS);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // Promise que resolve quando o MediaRecorder para
      const recordingDone = new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
      });

      // Cache de imagens SVG renderizadas (double-buffer para evitar flicker)
      // A cada frame de animação, desenhamos os SVGs do frame anterior (já carregados)
      // enquanto pré-carregamos os SVGs do frame atual de forma assíncrona.
      let svgImageCache = [];

      let isCapturing = true;
      let animFrameId;

      // Loop de composição em tempo real sincronizado com requestAnimationFrame
      const compositeLoop = () => {
        if (!isCapturing) return;

        // Limpa e pinta fundo
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, width, height);

        // --- Camada 1: Background Media (vídeo ou imagem) ---
        const bgVideo = playerElement.querySelector("video");
        const bgImg = playerElement.querySelector("img");
        if (bgVideo && bgVideo.readyState >= 2) {
          ctx.drawImage(bgVideo, 0, 0, width, height);
        } else if (bgImg && bgImg.complete) {
          ctx.drawImage(bgImg, 0, 0, width, height);
        }

        // --- Camada 2: Heatmap canvas (h337) ---
        const heatmapCanvas = playerElement.querySelector(".heatmap-canvas");
        if (heatmapCanvas) {
          ctx.drawImage(heatmapCanvas, 0, 0, width, height);
        }

        // --- Camada 3: Gaze trail canvas ---
        const gazeCanvas = playerElement.querySelector(".gaze-canvas");
        if (gazeCanvas) {
          ctx.drawImage(gazeCanvas, 0, 0, width, height);
        }

        // --- Camada 4: SVG overlays (Bolhas / GazePlot) via cache ---
        // Desenha os SVGs já rasterizados do frame anterior (síncrono, sem flicker)
        for (let i = 0; i < svgImageCache.length; i++) {
          const cached = svgImageCache[i];
          if (cached && cached.complete && cached.naturalWidth > 0) {
            ctx.drawImage(cached, 0, 0, width, height);
          }
        }

        // Pré-carrega os SVGs do frame atual para o PRÓXIMO ciclo de desenho
        const svgContainer = playerElement.querySelector(
          ".custom-svg-overlays-container",
        );
        const svgs = svgContainer
          ? svgContainer.querySelectorAll("svg")
          : [];

        if (svgs.length > 0) {
          const nextCache = [];
          svgs.forEach((svg) => {
            const serialized = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([serialized], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => URL.revokeObjectURL(url);
            img.onerror = () => URL.revokeObjectURL(url);
            img.src = url;
            nextCache.push(img);
          });
          svgImageCache = nextCache;
        }

        // Progresso baseado no frame atual do Remotion Player
        try {
          const currentFrame = player.getCurrentFrame();
          setRecordingProgress(
            Math.min(99, Math.round((currentFrame / totalFrames) * 100)),
          );
        } catch {
          // getCurrentFrame pode falhar durante a transição — ignora
        }

        animFrameId = requestAnimationFrame(compositeLoop);
      };

      // Handler para quando o Remotion Player termina a reprodução
      const handlePlayerEnded = () => {
        isCapturing = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);

        // Captura mais um frame final para garantir o último estado
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, width, height);
        const bgVideo = playerElement.querySelector("video");
        const bgImg = playerElement.querySelector("img");
        if (bgVideo && bgVideo.readyState >= 2) {
          ctx.drawImage(bgVideo, 0, 0, width, height);
        } else if (bgImg && bgImg.complete) {
          ctx.drawImage(bgImg, 0, 0, width, height);
        }
        const hc = playerElement.querySelector(".heatmap-canvas");
        if (hc) ctx.drawImage(hc, 0, 0, width, height);
        const gc = playerElement.querySelector(".gaze-canvas");
        if (gc) ctx.drawImage(gc, 0, 0, width, height);
        for (let i = 0; i < svgImageCache.length; i++) {
          const cached = svgImageCache[i];
          if (cached && cached.complete && cached.naturalWidth > 0) {
            ctx.drawImage(cached, 0, 0, width, height);
          }
        }

        // Para o gravador após um pequeno delay para o último frame ser encodado
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, 200);
      };

      // Configura: seek para o início, espera renderizar, começa gravação
      player.pause();
      player.seekTo(0);
      await new Promise((r) => setTimeout(r, 500));

      // Ouve o evento 'ended' do Remotion Player
      player.addEventListener("ended", handlePlayerEnded);

      // Fallback: se o player não emitir 'ended', para automaticamente pelo timer
      const maxDurationMs = (totalFrames / estimatedCaptureFps) * 1000 + 2000;
      const fallbackTimer = setTimeout(() => {
        if (isCapturing) {
          handlePlayerEnded();
        }
      }, maxDurationMs);

      // Inicia gravação e reprodução
      mediaRecorder.start();
      compositeLoop();
      player.play();

      // Aguarda a finalização do MediaRecorder
      await recordingDone;

      // Limpa recursos
      clearTimeout(fallbackTimer);
      player.removeEventListener("ended", handlePlayerEnded);

      // Gera o download
      setRecordingProgress(100);
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `heatmap-video-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Reseta o player
      player.seekTo(0);
    } catch (error) {
      console.error("Erro ao gravar vídeo:", error);
    } finally {
      setIsRecording(false);
      setRecordingProgress(0);
    }
  }, [width, height, totalFrames, estimatedCaptureFps]);

  return (
    <div className="flex w-full flex-col items-center">
      {/* Controls bar */}
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
            {coords.length === 0 && (
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
          disabled={isRecording || !normalizedCoords.length}
          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${
            isRecording
              ? "border-amber-400 bg-amber-400/20 text-amber-600 dark:text-amber-300 cursor-wait"
              : "border-sinapgreen-500 bg-sinapgreen-500 text-black hover:bg-sinapgreen-600"
          }`}
          title={isRecording ? "Gravando..." : "Baixar vídeo"}
        >
          <DownloadIcon fontSize="small" />
          {isRecording ? (
            <span className="text-sm">{recordingProgress}%</span>
          ) : (
            <span className="text-sm hidden sm:inline">Baixar</span>
          )}
        </button>
      </div>

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
            fps={estimatedCaptureFps}
            compositionWidth={width}
            compositionHeight={height}
            style={{
              width: width / 1.5,
              height: height / 1.5,
              maxHeight: "70vh",
            }}
            controls={true}
            inputProps={{
              heatmapData,
              img: resolvedMediaUrl,
              type: mediaType,
              modes,
              coordsBySession: coordsBySession || [],
              selectedSessionId: selectedSessionId || "all",
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
                Gravando — {recordingProgress}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NHeatmapVideo;
