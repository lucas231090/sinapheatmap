import { useEffect } from "react";
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
  useEffect(() => {
    if (coords.length > 0 && canvasSize.width > 0 && canvasSize.height > 0) {
      document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

      const heatmapInstance = h337.create({
        container: document.querySelector(".heatmapContainer"),
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
  }, [coords, canvasSize, radiusScale]);

  return (
    <div
      className="heatmapContainer"
      ref={heatmapCanvasRef}
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
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
            objectPosition: "center",
            backgroundColor: "#000",
            visibility: "visible",
            position: "absolute",
            inset: 0,
          }}
          alt="Heatmap background"
        />
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default HeatmapRenderer;
