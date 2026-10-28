import { Composition } from "remotion";
import { HeatmapComposition } from "../../../../fe/src/components/heatmap/HeatmapComposition";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HeatmapExport"
        component={HeatmapComposition}
        durationInFrames={150} // Sobrescrito via inputProps no renderMedia
        fps={60}
        width={1280}
        height={720}
        defaultProps={{
          heatmapData: { coords: [], canvasSize: { width: 1280, height: 720 }, captureFps: 60, durationMs: 2500, exposureSeconds: 10, radiusScale: 1 },
          img: "",
          type: 0,
          modes: { heatmap: true, bubbles: false, gazePlot: false },
          coordsBySession: [],
          selectedSessionId: "all"
        }}
        calculateMetadata={({ props }) => {
          const fps = 60;
          const heatmapData = props.heatmapData || {};
          const parsedExposureSeconds = Number.parseFloat(heatmapData.exposureSeconds) > 0 ? Number.parseFloat(heatmapData.exposureSeconds) : 10;
          const parsedDurationMs = Number(heatmapData.durationMs);
          const effectiveDurationMs = Number.isFinite(parsedDurationMs) && parsedDurationMs > 0 ? parsedDurationMs : parsedExposureSeconds * 1000;
          
          const totalFrames = Math.max(Math.ceil((effectiveDurationMs / 1000) * fps) + fps, 150);
          
          return {
            durationInFrames: totalFrames,
            props,
          };
        }}
      />
    </>
  );
};
