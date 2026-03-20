import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Componentes
import Controls from "@/components/HeatmapStatic/Controls";
import HeatmapRenderer from "@/components/HeatmapStatic/HeatmapRenderer";
import BubbleCanvas from "@/components/HeatmapStatic/BubbleCanvas";

// Hooks
import useHeatmapStaticLogic from "@/hooks/useHeatmapStaticLogic";

/**
 * Página de Heatmap Estático
 * Componente responsável apenas pela apresentação da interface de heatmap estático
 * Toda a lógica está separada no hook useHeatmapStaticLogic
 */
const HeatmapStatic = () => {
  const { id } = useParams();
  const transformComponentRef = useRef(null);
  const fitContainerRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);

  // Hook centralizado para toda a lógica do heatmap estático
  const {
    // Refs
    canvasRef,
    heatmapCanvasRef,
    imgRef,

    // Estados de visibilidade
    canvasVisible,
    setCanvasVisible,
    heatmapCanvasVisible,
    setHeatmapCanvasVisible,

    // Dados do heatmap
    fileName,
    dataFile,
    img,
    coords,
    canvasSize,
    radiusScale,
    isLoading,
    error,

    // Estados de seleção
    selectedTestIndex,
    setSelectedTestIndex,

    // Funções
    downloadHeatMap,
  } = useHeatmapStaticLogic(id);

  useEffect(() => {
    if (!fitContainerRef.current) return;

    const element = fitContainerRef.current;

    const updateScale = () => {
      if (!canvasSize.width || !element.clientWidth) return;
      // Keep it simple: fit by width (zoom controls still work)
      const scale = Math.min(1, element.clientWidth / canvasSize.width);
      setFitScale(scale);
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => updateScale());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [canvasSize.width]);

  // Exibe loading se estiver carregando
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Carregando heatmap...</div>
      </div>
    );
  }

  // Exibe erro se houver
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-500">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start md:items-center p-4 overflow-x-hidden w-full">
      <div className="flex flex-row w-full min-w-0" ref={fitContainerRef}>
        <div className="bg-card dark:bg-darkcard p-4 rounded-lg flex flex-col items-center w-full max-w-full min-w-0">
          <TransformWrapper
            key={`${id}-${canvasSize.width}-${canvasSize.height}-${fitScale}`}
            ref={transformComponentRef}
            initialScale={fitScale}
            minScale={Math.max(0.1, fitScale * 0.5)}
          >
            <p className="mb-2 text-3xl text-title dark:text-darktitle">
              <strong>Heatmap:</strong> {fileName || "Nenhum ID fornecido"}
            </p>

            <Controls
              transformComponentRef={transformComponentRef}
              heatmapCanvasVisible={heatmapCanvasVisible}
              setHeatmapCanvasVisible={setHeatmapCanvasVisible}
              canvasVisible={canvasVisible}
              setCanvasVisible={setCanvasVisible}
              downloadHeatMap={downloadHeatMap}
              dataFile={dataFile}
              selectedTestIndex={selectedTestIndex}
              setSelectedTestIndex={setSelectedTestIndex}
            />

            <TransformComponent>
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <div
                  style={{
                    visibility: heatmapCanvasVisible ? "visible" : "hidden",
                    position: "relative",
                  }}
                >
                  <HeatmapRenderer
                    heatmapCanvasRef={heatmapCanvasRef}
                    canvasSize={canvasSize}
                    img={img}
                    imgRef={imgRef}
                    coords={coords}
                    radiusScale={radiusScale}
                  />
                </div>
              )}

              <div
                style={{
                  visibility: canvasVisible ? "visible" : "hidden",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <BubbleCanvas
                  canvasRef={canvasRef}
                  canvasSize={canvasSize}
                  coords={coords}
                  transformComponentRef={transformComponentRef}
                />
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
};

export default HeatmapStatic;
