import React from "react";
import { render } from "@testing-library/react";
import BubbleCanvas from "@/components/heatmap/BubbleCanvas";

describe("BubbleCanvas", () => {
  it("draws bubbles on canvas", () => {
    const ctx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    };

    const contextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => ctx);

    render(
      <BubbleCanvas
        canvasRef={{ current: document.createElement("canvas") }}
        canvasSize={{ width: 100, height: 100 }}
        coords={[{ x: 10, y: 20 }]}
        transformComponentRef={{ current: { state: { scale: 1 } } }}
      />,
    );

    expect(ctx.fillText).toHaveBeenCalled();
    contextSpy.mockRestore();
  });
});
