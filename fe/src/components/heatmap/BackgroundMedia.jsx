import { Video } from "remotion";
import { memo } from "react";

export const BackgroundMedia = memo(({ img, type, durationInFrames, imageDisplayMode }) => {
  const shouldCover = imageDisplayMode === "cover";

  if (img && type === 1) {
    return (
      <div style={
        shouldCover 
          ? { position: "absolute", inset: 0, backgroundColor: "#020617" }
          : { position: "absolute", inset: 0, backgroundColor: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }
      }>
        <Video
          src={img}
          startFrom={0}
          endAt={durationInFrames}
          crossOrigin="anonymous"
          style={
            shouldCover
              ? { width: "100%", height: "100%", objectFit: "contain" }
              : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }
          }
        />
      </div>
    );
  }
  if (img) {
    return (
      <div style={
        shouldCover 
          ? { position: "absolute", inset: 0, backgroundColor: "#020617" }
          : { position: "absolute", inset: 0, backgroundColor: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }
      }>
        <img
          src={img}
          crossOrigin="anonymous"
          style={
            shouldCover
              ? { width: "100%", height: "100%", objectFit: "contain" }
              : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }
          }
          alt="bg"
        />
      </div>
    );
  }
  return null;
};
