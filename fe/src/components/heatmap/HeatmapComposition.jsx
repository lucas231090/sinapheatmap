import { useEffect, useRef, useState } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import h337 from "@mars3d/heatmap.js";
import AnimatedBubbleOverlay from "./AnimatedBubbleOverlay";
import AnimatedGazePlotOverlay from "./AnimatedGazePlotOverlay";
import { BackgroundMedia } from "./BackgroundMedia";
import { useHeatmapSessionData } from "./useHeatmapSessionData";

export const HeatmapComposition = ({
  heatmapData,
  img,
  type,
  modes,
  coordsBySession,
  selectedSessionId,
  imageDisplayMode,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig(); // Pega o FPS configurado (60)

  const containerRef = useRef(null);
  const heatmapInstanceRef = useRef(null);
  const gazeCanvasRef = useRef(null);

  const canvasSize = heatmapData.canvasSize || { width: 1280, height: 720 };
  const [heatmapInitialized, setHeatmapInitialized] = useState(false);

  // Resolve modes with defaults
  const activeModes = {
    heatmap: modes?.heatmap ?? true,
    bubbles: modes?.bubbles ?? false,
    gazePlot: modes?.gazePlot ?? false,
    heatmapOnlyBubbles: modes?.heatmapOnlyBubbles ?? false,
    fadeModeVisible: modes?.fadeModeVisible ?? false,
  };

  // MATEMÁTICA DO TEMPO REAL
  const currentTimeMs = (frame / fps) * 1000; // Tempo atual do vídeo em milissegundos

  const {
    sessionData,
    totalPointsAllSessions,
    expectedDurationMs,
    sessionCurrentCoords,
  } = useHeatmapSessionData({
    heatmapData,
    coordsBySession,
    selectedSessionId,
    activeModes,
    currentTimeMs,
  });


  // A visualização está completa quando passamos do tempo do último ponto + 1 segundo folga
  const isComplete =
    expectedDurationMs > 0 && currentTimeMs > expectedDurationMs + 1000;

  // Inicializa o Canvas do Heatmap (h337)
  useEffect(() => {
    if (!activeModes.heatmap) return;
    if (!containerRef.current || totalPointsAllSessions === 0) return;

    const initHeatmap = () => {
      try {
        import("@/utils/heatmapUtils").then(({ createColorGradient }) => {
          document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());
          heatmapInstanceRef.current = {};

          sessionData.forEach((group) => {
            const heatmapInstance = h337.create({
              container: containerRef.current,
              radius: Math.max(10, 50 * (heatmapData.radiusScale || 1)),
              maxOpacity: 0.75,
              minOpacity: 0.5,
              blur: 0.9,
              gradient: createColorGradient(group.color),
              backgroundColor: "rgba(255, 255, 255, 0)",
            });

            heatmapInstanceRef.current[group.sessionId] = heatmapInstance;

            if (group.interpolated.length > 0) {
              const dynamicMax = Math.max(200, Math.min(50, group.interpolated.length * 3));
              heatmapInstance.setData({
                max: dynamicMax,
                data: [group.interpolated[0]],
              });
            }
          });
          setHeatmapInitialized(true);
        });
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
    heatmapData.radiusScale,
    totalPointsAllSessions,
    sessionData,
    activeModes.heatmap,
  ]);

  // Atualiza os dados do Heatmap conforme o tempo avança
  useEffect(() => {
    if (!activeModes.heatmap || !heatmapInitialized) return;
    
    sessionCurrentCoords.forEach((group) => {
      const instance = heatmapInstanceRef.current?.[group.sessionId];
      if (instance && group.currentCoords.length > 0) {
        const dynamicMax = Math.max(200, Math.min(50, group.totalPoints * 3));
        instance.setData({
          max: dynamicMax,
          data: group.currentCoords,
        });
      }
    });
  }, [sessionCurrentCoords, heatmapInitialized, activeModes.heatmap]);

  // DESENHA O RASTRO DO OLHAR (GAZE) BASEADO NO TEMPO REAL
  useEffect(() => {
    if (!activeModes.heatmap) return;
    const canvas = gazeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isComplete) {
      sessionCurrentCoords.forEach((group) => {
        if (group.totalPoints === 0) return;
        const prev = group.interpolated[group.latestIdx];
        const nextIdx = Math.min(group.latestIdx + 1, group.totalPoints - 1);
        const next = group.interpolated[nextIdx];

        let x = prev.x;
        let y = prev.y;

        // Interpolação suave em tempo real
        if (next && next !== prev && next.timestamp > prev.timestamp) {
          const timeDiff = next.timestamp - prev.timestamp;
          const timePassed = currentTimeMs - prev.timestamp;
          const frac = Math.max(0, Math.min(1, timePassed / timeDiff));

          x = prev.x + (next.x - prev.x) * frac;
          y = prev.y + (next.y - prev.y) * frac;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = group.color ? group.color.fill : "rgba(255, 0, 0, 0.5)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = group.color ? group.color.stroke : "#fff";
        ctx.stroke();
        ctx.shadowColor = group.color ? group.color.stroke : "rgba(255, 0, 0, 0.8)";
        ctx.shadowBlur = 10;
        ctx.restore();
      });
    }
  }, [
    currentTimeMs,
    isComplete,
    sessionCurrentCoords,
    activeModes.heatmap,
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
            imageDisplayMode={imageDisplayMode}
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 bg-black/70 text-white rounded-lg text-2xl text-center z-30">
            <strong>Vídeo completo!</strong>
            <br />
            {`Visualização de ${totalPointsAllSessions} pontos concluída.`}
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
          imageDisplayMode={imageDisplayMode}
        />

        {/* Heatmap gaze trail canvas */}
        {activeModes.heatmap && (
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
        )}

        {/* Wrapper para isolar os SVGs das visualizações e não capturar os ícones do Remotion */}
        <div
          className="custom-svg-overlays-container"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 15,
          }}
        >
          {/* Animated Bubble overlay */}
          {activeModes.bubbles && (
            <AnimatedBubbleOverlay
              canvasSize={canvasSize}
              coords={heatmapData.coords}
              coordsBySession={coordsBySession}
              selectedSessionId={selectedSessionId}
              currentTimeMs={currentTimeMs}
              fadeModeVisible={activeModes.fadeModeVisible}
            />
          )}

          {/* Animated GazePlot overlay */}
          {activeModes.gazePlot && (
            <AnimatedGazePlotOverlay
              canvasSize={canvasSize}
              coords={heatmapData.coords}
              coordsBySession={coordsBySession}
              selectedSessionId={selectedSessionId}
              currentTimeMs={currentTimeMs}
              fadeModeVisible={activeModes.fadeModeVisible}
            />
          )}
        </div>

        {!heatmapInitialized && activeModes.heatmap && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-black/50 text-white rounded z-20">
            <div className="text-center text-white">
              Inicializando heatmap&hellip;
            </div>
          </div>
        )}

        <div className="absolute bottom-5 right-5 px-2.5 py-1 text-sm font-mono bg-black/50 text-white rounded z-20">
          <span>
            Tempo: {(currentTimeMs / 1000).toFixed(1)}s | Frame: {frame} |
            Pontos: {sessionCurrentCoords.reduce((acc, g) => acc + g.currentCoords.length, 0)} / {totalPointsAllSessions}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
