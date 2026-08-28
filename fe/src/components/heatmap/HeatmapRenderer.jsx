import { useCallback, useRef } from "react";
import h337 from "@mars3d/heatmap.js";
import { interpolateCoordinates, simplifyPath, createColorGradient } from "@/utils/heatmapUtils";

const HeatmapRenderer = ({
  heatmapCanvasRef,
  canvasSize,
  img,
  imgRef,
  coords,
  coordsBySession,
  selectedSessionId,
  radiusScale,
  disableInterpolation = false,
  imageDisplayMode,
}) => {
  const instancesRef = useRef([]);

  const combinedRef = useCallback((node) => {
    // 1. Assign ref to forwarded ref from parent
    if (heatmapCanvasRef) {
      if (typeof heatmapCanvasRef === "function") {
        heatmapCanvasRef(node);
      } else {
        heatmapCanvasRef.current = node;
      }
    }

    // 2. Perform h337 setup and cleanup
    if (!node) {
      document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());
      instancesRef.current = [];
      return;
    }

    if (canvasSize.width > 0 && canvasSize.height > 0) {
      document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());
      instancesRef.current = [];

      const isMultiSession = selectedSessionId === "all" && coordsBySession && coordsBySession.length > 1;

      if (isMultiSession) {
        coordsBySession.forEach((sessionGroup) => {
          if (sessionGroup.coords && sessionGroup.coords.length > 0) {
            const heatmapInstance = h337.create({
              container: node,
              radius: Math.max(10, 50 * radiusScale),
              maxOpacity: 0.75,
              minOpacity: 0.5,
              blur: 0.9,
              gradient: createColorGradient(sessionGroup.color),
              backgroundColor: "rgba(255, 255, 255, 0)",
            });

            const sessionCoords = disableInterpolation 
              ? simplifyPath(sessionGroup.coords, 6).map(c => ({ ...c, value: 200 }))
              : interpolateCoordinates(sessionGroup.coords);

            const dynamicMax = Math.max(200, Math.min(50, sessionCoords.length * 3));

            heatmapInstance.setData({
              max: dynamicMax,
              data: sessionCoords,
            });
            instancesRef.current.push(heatmapInstance);
          }
        });
      } else {
        if (coords.length > 0) {
          const heatmapInstance = h337.create({
            container: node,
            radius: Math.max(10, 50 * radiusScale),
            maxOpacity: 0.75,
            minOpacity: 0.5,
            blur: 0.9,
            backgroundColor: "rgba(255, 255, 255, 0)",
          });

          const dataToRender = disableInterpolation 
            ? coords.map(c => ({ ...c, value: 200 })) // NHeatmapStatic já passou por simplifyPath se heatmapOnlyBubbles
            : interpolateCoordinates(coords);
            
          const dynamicMax = Math.max(200, Math.min(50, dataToRender.length * 3));

          heatmapInstance.setData({
            max: dynamicMax,
            data: dataToRender,
          });
          instancesRef.current.push(heatmapInstance);
        }
      }
    }
  }, [heatmapCanvasRef, coords, coordsBySession, selectedSessionId, canvasSize, radiusScale, disableInterpolation]);

  return (
    <div
      className="heatmapContainer"
      ref={combinedRef}
      style={{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        position: "relative",
      }}
    >
      {img ? (
        <div
          className={
            imageDisplayMode === "cover"
              ? "absolute inset-0 bg-slate-950"
              : "absolute inset-0 flex items-center justify-center bg-slate-950"
          }
        >
          <img
            ref={imgRef}
            src={img}
            crossOrigin="anonymous"
            className={
              imageDisplayMode === "cover"
                ? "block h-full w-full object-contain object-center visible"
                : "block max-h-full max-w-full object-contain object-center visible"
            }
            alt="Heatmap background"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-slate-950"></div>
      )}
    </div>
  );
};

export default HeatmapRenderer;
