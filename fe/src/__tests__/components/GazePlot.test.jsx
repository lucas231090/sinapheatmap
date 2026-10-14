import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import GazePlot from "@/components/heatmap/GazePlot";

describe("GazePlot", () => {
  it("shows accumulated time when the gaze returns to a region", () => {
    render(
      <GazePlot
        canvasSize={{ width: 240, height: 180 }}
        coords={[
          { x: 10, y: 10, timestamp: 0 },
          { x: 11, y: 11, timestamp: 100 },
          { x: 100, y: 100, timestamp: 200 },
          { x: 101, y: 101, timestamp: 300 },
          { x: 12, y: 12, timestamp: 400 },
          { x: 13, y: 13, timestamp: 600 },
        ]}
        transformComponentRef={{ current: { state: { scale: 1 } } }}
      />,
    );

    fireEvent.mouseMove(screen.getByTestId("gazeplot-svg"), {
      clientX: 11,
      clientY: 11,
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Fixação 1");
    expect(tooltip.textContent).toContain("Total: 300 ms");
    expect(tooltip.textContent).toContain("2 passagens");
    expect(tooltip.textContent).toContain("00:00.000-00:00.100");
    expect(tooltip.textContent).toContain("00:00.400-00:00.600");
  });
});
