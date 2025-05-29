import { Composition } from "remotion";
import { HeatmapComposition } from "@/components/Heatmap/HeatmapComposition";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HeatmapVideo"
        component={HeatmapComposition}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          heatmapData: {
            coords: [],
            radiusScale: 1,
            canvasSize: { width: 1280, height: 720 },
          },
          img: null,
        }}
      />
    </>
  );
};
