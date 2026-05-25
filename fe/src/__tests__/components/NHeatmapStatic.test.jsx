import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NHeatmapStatic from "@/components/heatmap/NHeatmapStatic";
import { downloadHeatMapImage } from "@/utils/heatmapUtils";

vi.mock("@/components/heatmap/HeatmapRenderer", async () => ({ default: () => (
  <div data-testid="heatmap-renderer" />
) }));

vi.mock("@/components/heatmap/BubbleCanvas", async () => ({ default: () => (
  <div data-testid="bubble-canvas" />
) }));

vi.mock("@/utils/heatmapUtils", async () => ({
  downloadHeatMapImage: vi.fn(),
}));

vi.mock("react-zoom-pan-pinch", async () => {
  const React = require("react");
  return {
    TransformWrapper: React.forwardRef(({ children }, ref) => {
      React.useImperativeHandle(ref, () => ({
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        resetTransform: vi.fn(),
      }));
      return <div>{children}</div>;
    }),
    TransformComponent: ({ children }) => <div>{children}</div>,
  };
});

describe("NHeatmapStatic", () => {
  it("renders controls and triggers download", () => {
    render(
      <NHeatmapStatic
        experimentId="1"
        coords={[{ x: 10, y: 10, value: 1 }]}
        canvasSize={{ width: 300, height: 200 }}
        radiusScale={1}
        mediaUrl=""
      />,
    );

    fireEvent.click(screen.getByLabelText(/baixar imagem/i));
    expect(downloadHeatMapImage).toHaveBeenCalled();
  });
});
