import React, { useEffect, useRef, useState } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import h337 from "@mars3d/heatmap.js";

/**
 * Componente de composição de heatmap para Remotion
 * Responsável por renderizar o heatmap em formato de vídeo
 */
export const HeatmapComposition = ({ heatmapData, img }) => {
  // Obtém o frame atual e as configurações do vídeo
  // frame: Frame atual do vídeo
  // fps: Frames por segundo
  // durationInFrames: Duração total do vídeo em frames
  // containerRef: Referência para o container do heatmap
  // heatmapInstanceRef: Referência para a instância do heatmap
  // canvasSize: Tamanho do canvas do heatmap
  // heatmapInitialized: Estado para verificar se o heatmap foi inicializado
  // windowSize: Tamanho da janela do navegador
  // pointsToShow: Número de pontos a serem exibidos no heatmap
  // currentCoords: Coordenadas atuais a serem exibidas
  // isComplete: Verifica se todos os pontos foram exibidos
  // currentGazePoint: Ponto de gaze atual a ser destacado
  // FRAMES_PER_POINT: Número de frames por ponto
  // pointsToShow: Número de pontos a serem exibidos
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const containerRef = useRef(null);
  const heatmapInstanceRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [heatmapInitialized, setHeatmapInitialized] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Calculate how many points to show based on current frame
  const FRAMES_PER_POINT = 10;
  const pointsToShow = Math.min(
    Math.floor(frame / FRAMES_PER_POINT) + 1,
    heatmapData.coords.length
  );
  const currentCoords = heatmapData.coords.slice(0, pointsToShow);

  // Check if all points have been displayed
  const isComplete = pointsToShow >= heatmapData.coords.length;

  // Show current gaze point with a different visualization
  const currentGazePoint =
    currentCoords.length > 0 ? currentCoords[currentCoords.length - 1] : null;

  // Atualiza o tamanho do canvas quando os dados mudam
  useEffect(() => {
    if (heatmapData.canvasSize) {
      setCanvasSize(heatmapData.canvasSize);
    }
  }, [heatmapData.canvasSize]);

  // Inicializa o heatmap assim que o componente montar e o containerRef estiver disponível
  useEffect(() => {
    // Certifique-se de que o containerRef existe e temos coordenadas
    if (!containerRef.current || heatmapData.coords.length === 0) return;

    // Função para inicializar o heatmap
    const initHeatmap = () => {
      try {
        // Limpe qualquer canvas existente
        document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

        // Crie um novo heatmap com os parâmetros corretos
        const heatmapInstance = h337.create({
          container: containerRef.current,
          radius: Math.max(10, 50 * (heatmapData.radiusScale || 1)),
          maxOpacity: 1,
          minOpacity: 0.2,
          blur: 0.9,
          backgroundColor: "rgba(255, 255, 255, 0)",
        });

        // Salvar a instância para uso posterior
        heatmapInstanceRef.current = heatmapInstance;

        // Se tivermos coordenadas, inicialize com pelo menos o primeiro ponto
        // Isso força o heatmap a renderizar imediatamente
        if (heatmapData.coords.length > 0) {
          heatmapInstanceRef.current.setData({
            data: [heatmapData.coords[0]],
          });
        }

        setHeatmapInitialized(true);
      } catch (error) {
        console.error("Erro ao inicializar heatmap:", error);
      }
    };

    // Inicialize imediatamente...
    initHeatmap();

    // ...e novamente após um pequeno atraso para garantir que o DOM está pronto
    const timer = setTimeout(initHeatmap, 100);

    return () => {
      clearTimeout(timer);
      if (heatmapInstanceRef.current) {
        // Cleanup quando o componente for desmontado
        document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());
      }
    };
  }, [
    containerRef.current,
    heatmapData.coords.length,
    heatmapData.radiusScale,
  ]);

  // Atualiza os dados do heatmap quando o frame muda
  useEffect(() => {
    if (
      heatmapInstanceRef.current &&
      heatmapInitialized &&
      currentCoords.length > 0
    ) {
      // Atualiza o heatmap com as coordenadas atuais
      heatmapInstanceRef.current.setData({
        data: currentCoords,
      });
    }
  }, [currentCoords, heatmapInitialized]);

  // Listen for window resize
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Força uma atualização do heatmap quando o container muda de tamanho
  useEffect(() => {
    if (heatmapInstanceRef.current && heatmapInitialized) {
      // Se o tamanho mudar, reinstancie o heatmap
      const reinitHeatmap = () => {
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

        if (currentCoords.length > 0) {
          heatmapInstanceRef.current.setData({
            data: currentCoords,
          });
        }
      };

      // Pequeno atraso para garantir que o DOM está atualizado
      const timer = setTimeout(reinitHeatmap, 50);
      return () => clearTimeout(timer);
    }
  }, [
    canvasSize.width,
    canvasSize.height,
    windowSize.width,
    windowSize.height,
  ]);

  // Quando o vídeo estiver completo, exiba uma mensagem de conclusão
  if (isComplete && frame > heatmapData.coords.length * FRAMES_PER_POINT + 60) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#fff" }}>
        <div
          ref={containerRef}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            position: "relative",
            margin: "0 auto",
          }}
        >
          {img && (
            <img
              src={img}
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                visibility: "visible",
              }}
              alt="Heatmap background"
            />
          )}

          {/* Mostra mensagem de conclusão */}
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
            {`Visualização de ${heatmapData.coords.length} pontos concluída.`}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      <div
        ref={containerRef}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: "relative",
          margin: "0 auto",
        }}
      >
        {img && (
          <img
            src={img}
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              visibility: "visible",
            }}
            alt="Heatmap background"
          />
        )}

        {/* Apontador do ponto atual */}
        {currentGazePoint && !isComplete && (
          <div
            style={{
              position: "absolute",
              top: currentGazePoint.y,
              left: currentGazePoint.x,
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "2px solid #fff",
              backgroundColor: "rgba(255, 0, 0, 0.5)",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 10px rgba(255, 0, 0, 0.8)",
              zIndex: 10,
              pointerEvents: "none",
              transition: "all 0.1s ease-out",
            }}
          />
        )}

        {/* Indicador de carregamento durante inicialização */}
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

        {/* Contador de Frames e Contador de pontos */}
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
          {isComplete ? (
            <span>
              {" "}
              Frame: {frame} | Pontos de gaze: {currentCoords.length} /{" "}
              {heatmapData.coords.length}{" "}
            </span>
          ) : (
            <span>
              Frame: {frame} | Pontos de gaze: {currentCoords.length} /{" "}
              {heatmapData.coords.length}{" "}
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
