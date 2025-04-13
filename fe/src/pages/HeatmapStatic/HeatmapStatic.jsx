import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Componentes
import Controls from "./components/Controls";
import HeatmapRenderer from "./components/HeatmapRenderer";
import BubbleCanvas from "./components/BubbleCanvas";

// Hooks
import useHeatmapData from "./hooks/useHeatmapData";

const HeatmapStatic = () => {
  const { id } = useParams();
  const transformComponentRef = useRef(null);

  // Defina todos os refs aqui para passar ao hook
  const canvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const imgRef = useRef(null);

  // Estados compartilhados
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [heatmapCanvasVisible, setHeatmapCanvasVisible] = useState(true);
  const [selectedTestIndex, setSelectedTestIndex] = useState("all");

  // Custom hook para gerenciar dados do heatmap
  const {
    fileName,
    dataFile,
    img,
    coords,
    canvasSize,
    radiusScale,
    done,
    windowSize,
    downloadHeatMap,
  } = useHeatmapData(
    id,
    selectedTestIndex,
    canvasRef,
    heatmapCanvasRef,
    imgRef,
    heatmapCanvasVisible,
    canvasVisible
  );

  return (
    <div className="flex flex-col items-start md:items-center p-4 overflow-x-auto">
      <div className="flex flex-row">
        <div className="bg-white dark:bg-gray-600 p-4 rounded-lg flex flex-col items-center">
          <TransformWrapper ref={transformComponentRef}>
            <p className="mb-2 text-3xl text-black dark:text-white">
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
