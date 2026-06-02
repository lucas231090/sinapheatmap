import { useCallback } from "react";
import h337 from "@mars3d/heatmap.js";
import { interpolateCoordinates } from "@/utils/heatmapUtils";

const HeatmapRenderer = ({
  heatmapCanvasRef,
  canvasSize,
  img,
  imgRef,
  coords,
  radiusScale,
}) => {
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
      return;
    }

    if (coords.length > 0 && canvasSize.width > 0 && canvasSize.height > 0) {
      document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

      const heatmapInstance = h337.create({
        container: node,
        radius: Math.max(10, 50 * radiusScale),
        maxOpacity: 1,
        minOpacity: 0.3,
        blur: 0.9,
        backgroundColor: "rgba(255, 255, 255, 0)",
      });

      const interpolated = interpolateCoordinates(coords);
      // Dinâmico: quanto mais frames (tempo e trajeto), mais "resistente" é a tela para ficar vermelha
      const dynamicMax = Math.max(200, Math.min(50, interpolated.length * 3));

      heatmapInstance.setData({
        max: dynamicMax,
        data: interpolated,
      });
    }
  }, [heatmapCanvasRef, coords, canvasSize, radiusScale]);

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
        <img
          ref={imgRef}
          src={img}
          crossOrigin="anonymous"
          className="absolute inset-0 block h-full w-full object-contain object-center bg-slate-950 visible"
          alt="Heatmap background"
        />
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default HeatmapRenderer;
