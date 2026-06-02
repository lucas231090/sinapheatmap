import { useEffect, useRef, useState, useMemo } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill, Video } from "remotion";
import h337 from "@mars3d/heatmap.js";
import { interpolateCoordinates } from "@/utils/heatmapUtils";

const BackgroundMedia = ({ img, type, durationInFrames }) => {
  if (img && type === 1) {
    return (
      <Video
        src={img}
        startFrom={0}
        endAt={durationInFrames}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "#020617",
        }}
      />
    );
  }
  if (img) {
    return (
      <img
        src={img}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "#020617",
        }}
        alt="bg"
      />
    );
  }
  return null;
};

export const HeatmapComposition = ({ heatmapData, img, type }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig(); // Pega o FPS configurado (60)

  const containerRef = useRef(null);
  const heatmapInstanceRef = useRef(null);
  const gazeCanvasRef = useRef(null);

  const canvasSize = heatmapData.canvasSize || { width: 1280, height: 720 };
  const [heatmapInitialized, setHeatmapInitialized] = useState(false);

  // MATEMÁTICA DO TEMPO REAL
  const currentTimeMs = (frame / fps) * 1000; // Tempo atual do vídeo em milissegundos
  // INTERPOLAÇÃO (Executada uma vez no vídeo todo)
  const interpolatedCoords = useMemo(
    () => interpolateCoordinates(heatmapData.coords),
    [heatmapData.coords],
  );

  const totalPoints = interpolatedCoords.length;
  const expectedDurationMs = useMemo(() => {
    return Number(heatmapData.durationMs) > 0
      ? Number(heatmapData.durationMs)
      : Number(heatmapData.exposureSeconds) > 0
        ? Number(heatmapData.exposureSeconds) * 1000
        : totalPoints > 0
          ? interpolatedCoords[totalPoints - 1]?.timestamp || 0
          : 0;
  }, [
    heatmapData.durationMs,
    heatmapData.exposureSeconds,
    totalPoints,
    interpolatedCoords,
  ]);

  // Encontra o último ponto interpolado que ocorreu ANTES ou NO MOMENTO do tempo atual
  let latestIdx =
    interpolatedCoords.findIndex((c) => c.timestamp > currentTimeMs) - 1;

  if (latestIdx === -2) {
    latestIdx = totalPoints - 1;
  }
  if (latestIdx < 0) {
    latestIdx = 0;
  }

  const currentCoords = interpolatedCoords.slice(0, latestIdx + 1);

  // A visualização está completa quando passamos do tempo do último ponto + 1 segundo folga
  const isComplete =
    expectedDurationMs > 0 && currentTimeMs > expectedDurationMs + 1000;

  // Inicializa o Canvas do Heatmap (h337)
  useEffect(() => {
    if (!containerRef.current || totalPoints === 0) return;

    const initHeatmap = () => {
      try {
        document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

        const heatmapInstance = h337.create({
          container: containerRef.current,
          radius: Math.max(10, 50 * (heatmapData.radiusScale || 1)),
          maxOpacity: 1,
          minOpacity: 0.1,
          blur: 0.9,
          backgroundColor: "rgba(255, 255, 255, 0)",
        });

        heatmapInstanceRef.current = heatmapInstance;

        if (totalPoints > 0) {
          const dynamicMax = Math.max(200, Math.min(50, totalPoints * 3));
          heatmapInstanceRef.current.setData({
            max: dynamicMax,
            data: [interpolatedCoords[0]],
          });
        }
        setHeatmapInitialized(true);
      } catch (error) {
        console.error("Erro ao inicializar heatmap:", error);
      }
    };

    initHeatmap();
    const timer = setTimeout(initHeatmap, 100);
    return () => {
      clearTimeout(timer);
      document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());
    };
  }, [
    containerRef,
    heatmapData.coords,
    heatmapData.radiusScale,
    totalPoints,
    interpolatedCoords,
  ]);

  // Atualiza os dados do Heatmap conforme o tempo avança
  useEffect(() => {
    if (
      heatmapInstanceRef.current &&
      heatmapInitialized &&
      currentCoords.length > 0
    ) {
      const dynamicMax = Math.max(200, Math.min(50, totalPoints * 3));
      heatmapInstanceRef.current.setData({
        max: dynamicMax,
        data: currentCoords,
      });
    }
  }, [currentCoords, heatmapInitialized, totalPoints]);

  // DESENHA O RASTRO DO OLHAR (GAZE) BASEADO NO TEMPO REAL
  useEffect(() => {
    const canvas = gazeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isComplete && totalPoints > 0) {
      const prev = interpolatedCoords[latestIdx];
      const nextIdx = Math.min(latestIdx + 1, totalPoints - 1);
      const next = interpolatedCoords[nextIdx];

      let x = prev.x;
      let y = prev.y;

      // Interpolação suave em tempo real entre o ponto atual e o próximo
      if (next && next !== prev && next.timestamp > prev.timestamp) {
        const timeDiff = next.timestamp - prev.timestamp;
        const timePassed = currentTimeMs - prev.timestamp;
        // fracção exata do percurso baseada nos milissegundos
        const frac = Math.max(0, Math.min(1, timePassed / timeDiff));

        x = prev.x + (next.x - prev.x) * frac;
        y = prev.y + (next.y - prev.y) * frac;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
      ctx.shadowBlur = 10;
      ctx.restore();
    }
  }, [
    frame,
    canvasSize,
    interpolatedCoords,
    totalPoints,
    latestIdx,
    currentTimeMs,
    isComplete,
  ]);

  // Renderização final (Feedback de Conclusão)
  if (isComplete) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#020617" }}>
        <div
          ref={containerRef}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            position: "relative",
            margin: "0 auto",
          }}
        >
          <BackgroundMedia
            img={img}
            type={type}
            durationInFrames={durationInFrames}
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 bg-black/70 text-white rounded-lg text-2xl text-center z-30">
            <strong>Vídeo completo!</strong>
            <br />
            {`Visualização de ${totalPoints} pontos concluída.`}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <div
        ref={containerRef}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: "relative",
          margin: "0 auto",
        }}
      >
        <BackgroundMedia
          img={img}
          type={type}
          durationInFrames={durationInFrames}
        />

        <canvas
          ref={gazeCanvasRef}
          className="gaze-canvas"
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        {!heatmapInitialized && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-black/50 text-white rounded z-20">
            <div className="text-center text-white">
              Inicializando heatmap&hellip;
            </div>
          </div>
        )}

        <div className="absolute bottom-5 right-5 px-2.5 py-1 text-sm font-mono bg-black/50 text-white rounded z-20">
          <span>
            Tempo: {(currentTimeMs / 1000).toFixed(1)}s | Frame: {frame} |
            Pontos: {currentCoords.length} / {totalPoints}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
