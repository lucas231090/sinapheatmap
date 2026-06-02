import { useRef, useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import HeatmapRenderer from "./HeatmapRenderer";
import BubbleCanvas from "./BubbleCanvas";
import { downloadHeatMapImage } from "@/utils/heatmapUtils";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";

const NHeatmapStatic = ({
  experimentId,
  coords,
  canvasSize,
  radiusScale,
  mediaUrl,
}) => {
  const transformComponentRef = useRef(null);
  const fitContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const imgRef = useRef(null);

  const [fitScale, setFitScale] = useState(1);
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [canvasVisible, setCanvasVisible] = useState(false);

  useEffect(() => {
    if (!fitContainerRef.current) return;
    const element = fitContainerRef.current;

    const updateScale = () => {
      if (!canvasSize.width || !element.clientWidth) return;
      const scale = Math.min(1, element.clientWidth / canvasSize.width);
      setFitScale(scale);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(() => updateScale());
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [canvasSize.width]);

  const handleDownload = () => {
    downloadHeatMapImage({
      heatmapCanvasRef,
      canvasRef,
      imgRef,
      canvasSize,
      heatmapVisible,
      canvasVisible,
      fileName: `experiment-${experimentId}`,
    });
  };

  return (
    <div className="flex w-full flex-col items-center ">
      <div className="mb-4 flex w-full flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-800 p-4 shadow-sm lg:flex-row">
        <aside className="flex flex-row  gap-3 lg:w-24 lg:flex-col lg:gap-4 flex-wrap sm:flex-nowrap ">
          <label
            className={`w-full lg:w-auto lg:h-full group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
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
            <span className="flex size-10 items-center justify-center rounded-xl border border-transparent text-current transition group-hover:scale-105 peer-checked:text-black">
              {heatmapVisible ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <VisibilityOffIcon fontSize="small" />
              )}
            </span>
            <span className="sr-only">Mostrar heatmap</span>
          </label>

          <label
            className={`w-full lg:w-auto lg:h-full group flex cursor-pointer items-center justify-center rounded-2xl border p-3 transition ${
              canvasVisible
                ? "border-sinapgreen-500 bg-sinapgreen-500 text-black shadow-sm"
                : "border-slate-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title={canvasVisible ? "Ocultar bolhas" : "Mostrar bolhas"}
          >
            <input
              type="checkbox"
              checked={canvasVisible}
              onChange={(e) => setCanvasVisible(e.target.checked)}
              className="peer sr-only"
            />
            <span className="flex size-10 items-center justify-center rounded-xl border border-transparent text-current transition group-hover:scale-105 peer-checked:text-black">
              <CircleOutlinedIcon fontSize="small" />
            </span>
            <span className="sr-only">Mostrar bolhas e gaze</span>
          </label>

          <button
            type="button"
            onClick={() => {
              if (transformComponentRef.current) {
                transformComponentRef.current.zoomIn();
              }
            }}
            className="w-full lg:w-auto lg:h-full flex items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 p-3 text-slate-700 dark:text-slate-300 transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <ZoomInIcon fontSize="small" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (transformComponentRef.current) {
                transformComponentRef.current.zoomOut();
              }
            }}
            className="w-full lg:w-auto lg:h-full flex items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-slate-800  p-3 text-slate-700 dark:text-slate-300 transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Reduzir zoom"
            aria-label="Reduzir zoom"
          >
            <ZoomOutIcon fontSize="small" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (transformComponentRef.current) {
                transformComponentRef.current.resetTransform();
              }
            }}
            className="w-full lg:w-auto lg:h-full flex items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-slate-800  p-3 text-slate-700 dark:text-slate-300 transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Resetar zoom"
            aria-label="Resetar zoom"
          >
            <RestartAltIcon fontSize="small" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full lg:w-auto lg:h-full flex items-center justify-center rounded-2xl border border-sinapgreen-500 bg-sinapgreen-500 p-3 text-black transition hover:bg-sinapgreen-600"
            title="Baixar imagem"
            aria-label="Baixar imagem"
          >
            <DownloadIcon fontSize="small" />
          </button>
        </aside>

        <div
          className="flex min-w-0 flex-1 justify-center"
          ref={fitContainerRef}
        >
          <div className="flex w-full max-w-[1280px] flex-col items-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <TransformWrapper
              key={`${experimentId}-${canvasSize.width}-${canvasSize.height}-${fitScale}`}
              ref={transformComponentRef}
              initialScale={fitScale}
              minScale={Math.max(0.1, fitScale * 0.5)}
            >
              <TransformComponent>
                <div className="relative">
                  {canvasSize.width > 0 && canvasSize.height > 0 && (
                    <div
                      style={{
                        visibility: heatmapVisible ? "visible" : "hidden",
                        position: "relative",
                      }}
                    >
                      <HeatmapRenderer
                        heatmapCanvasRef={heatmapCanvasRef}
                        canvasSize={canvasSize}
                        img={mediaUrl}
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
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NHeatmapStatic;
