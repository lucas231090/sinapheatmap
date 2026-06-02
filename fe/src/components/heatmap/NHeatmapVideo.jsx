import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { HeatmapComposition } from "./HeatmapComposition";
import SpeedIcon from "@mui/icons-material/Speed";

const NHeatmapVideo = ({
  coords,
  canvasSize,
  radiusScale,
  mediaUrl,
  exposureSeconds,
  captureFps,
  durationMs,
}) => {
  const playerRef = useRef(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex w-full max-w-4xl flex-wrap items-center justify-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm text-black">
        <label className="flex items-center gap-2 text-black" htmlFor="select-speed">
          <SpeedIcon fontSize="small" />
          <span className="text-sm font-semibold">Velocidade:</span>
        </label>
        <select
          id="select-speed"
          value={playbackSpeed}
          onChange={handleSpeedChange}
          className="rounded-2xl border border-slate-200 bg-white p-2 text-black outline-none focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-500/20"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x (Normal)</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-600">
            Coleta estimada: {estimatedCaptureFps} fps
          </span>
          {coords.length === 0 && (
            <span className="text-sm text-amber-600">
              Nenhum dado de rastreio para este vídeo
            </span>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-[1280px] flex-col items-center rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
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
            }}
            autoPlay={false}
            clickToPlay={true}
            loop={false}
            doubleClickToFullscreen={true}
            playbackRate={playbackSpeed}
            acknowledgeRemotionLicense
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white bg-slate-950">
            <h3 className="text-xl mb-4">Aguardando dados&hellip;</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default NHeatmapVideo;
