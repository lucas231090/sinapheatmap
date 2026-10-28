import React from "react";
import { render, waitFor } from "@testing-library/react";
import HeatmapRenderer from "@/components/heatmap/HeatmapRenderer";
import h337 from "@mars3d/heatmap.js";

vi.mock("@mars3d/heatmap.js", async () => ({
  default: {
    create: vi.fn(() => ({
      setData: vi.fn(),
    })),
  }
}));

describe("HeatmapRenderer", () => {
  it("initializes heatmap when data is available", async () => {
    render(
      <HeatmapRenderer
        heatmapCanvasRef={{ current: null }}
        canvasSize={{ width: 200, height: 100 }}
        img=""
        imgRef={{ current: null }}
        coords={[{ x: 10, y: 20, value: 1 }]}
        radiusScale={1}
      />,
    );

    await waitFor(() => {
      expect(h337.create).toHaveBeenCalled();
    });
  });
});
