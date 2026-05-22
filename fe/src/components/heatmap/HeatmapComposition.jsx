import { useEffect, useRef, useState } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill, Video } from "remotion";
import h337 from "@mars3d/heatmap.js";

export const HeatmapComposition = ({ heatmapData, img, type }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig(); // Pega o FPS configurado (60)

  const containerRef = useRef(null);
  const heatmapInstanceRef = useRef(null);
  const gazeCanvasRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [heatmapInitialized, setHeatmapInitialized] = useState(false);

  // MATEMÁTICA DO TEMPO REAL
  const currentTimeMs = (frame / fps) * 1000; // Tempo atual do vídeo em milissegundos
  const totalPoints = heatmapData.coords.length;
  const expectedDurationMs =
    Number(heatmapData.durationMs) > 0
      ? Number(heatmapData.durationMs)
      : Number(heatmapData.exposureSeconds) > 0
      ? Number(heatmapData.exposureSeconds) * 1000
      : totalPoints > 0
      ? heatmapData.coords[totalPoints - 1]?.timestamp || 0
      : 0;

  // Encontra o último ponto de eyetracking que ocorreu ANTES ou NO MOMENTO do tempo atual
  let latestIdx =
    heatmapData.coords.findIndex((c) => c.timestamp > currentTimeMs) - 1;

  if (latestIdx === -2) {
    // Se o findIndex retornou -1, significa que o currentTimeMs é maior que todos os pontos (chegou no fim)
    latestIdx = totalPoints - 1;
  }
  if (latestIdx < 0) {
    latestIdx = 0; // Previne erro no frame 0
  }

  const currentCoords = heatmapData.coords.slice(0, latestIdx + 1);

  // A visualização está completa quando passamos do tempo do último ponto + 1 segundo folga
  const isComplete =
    expectedDurationMs > 0 && currentTimeMs > expectedDurationMs + 1000;

  useEffect(() => {
    if (heatmapData.canvasSize) setCanvasSize(heatmapData.canvasSize);
  }, [heatmapData.canvasSize]);

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
          minOpacity: 0.2,
          blur: 0.9,
          backgroundColor: "rgba(255, 255, 255, 0)",
        });

        heatmapInstanceRef.current = heatmapInstance;

        if (totalPoints > 0) {
          heatmapInstanceRef.current.setData({
            data: [heatmapData.coords[0]],
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
  }, [containerRef, heatmapData.coords, heatmapData.radiusScale, totalPoints]);

  // Atualiza os dados do Heatmap conforme o tempo avança
  useEffect(() => {
    if (
      heatmapInstanceRef.current &&
      heatmapInitialized &&
      currentCoords.length > 0
    ) {
      heatmapInstanceRef.current.setData({ data: currentCoords });
    }
  }, [currentCoords, heatmapInitialized]);

  // DESENHA O RASTRO DO OLHAR (GAZE) BASEADO NO TEMPO REAL
  useEffect(() => {
    const canvas = gazeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isComplete && totalPoints > 0) {
      const prev = heatmapData.coords[latestIdx];
      const nextIdx = Math.min(latestIdx + 1, totalPoints - 1);
      const next = heatmapData.coords[nextIdx];

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
    heatmapData.coords,
    totalPoints,
    latestIdx,
    currentTimeMs,
    isComplete,
  ]);

  // Renderização final (Feedback de Conclusão)
  if (isComplete) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <div
          ref={containerRef}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            position: "relative",
            margin: "0 auto",
          }}
        >
          {img && type === 1 ? (
            <Video
              src={img}
              startFrom={0}
              endAt={durationInFrames}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "#000",
              }}
            />
          ) : img ? (
            <img
              src={img}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "#000",
              }}
              alt="bg"
            />
          ) : null}

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              borderRadius: "10px",
              fontSize: "24px",
              textAlign: "center",
              zIndex: 30,
            }}
          >
            <strong>Vídeo completo!</strong>
            <br />
            {`Visualização de ${totalPoints} pontos concluída.`}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        ref={containerRef}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: "relative",
          margin: "0 auto",
        }}
      >
        {img && type === 1 ? (
          <Video
            src={img}
            startFrom={0}
            endAt={durationInFrames}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#000",
            }}
          />
        ) : img ? (
          <img
            src={img}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#000",
            }}
            alt="bg"
          />
        ) : null}

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
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "10px",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              borderRadius: "5px",
              zIndex: 20,
            }}
          >
            Inicializando heatmap...
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            padding: "5px 10px",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace",
            zIndex: 20,
          }}
        >
          <span>
            Tempo: {(currentTimeMs / 1000).toFixed(1)}s | Frame: {frame} |
            Pontos: {currentCoords.length} / {totalPoints}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
