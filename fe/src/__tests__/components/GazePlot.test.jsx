import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import GazePlot from "@/components/heatmap/GazePlot";

describe("GazePlot", () => {
  it("shows accumulated time when the gaze returns to a region", () => {
    const { container } = render(
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

    fireEvent.mouseEnter(screen.getByLabelText("Fixação 1"));

    expect(container.textContent).toContain("Total: 300 ms");
    expect(container.textContent).toContain("2 passagens");
    expect(container.textContent).toContain("00:00.000-00:00.100");
    expect(container.textContent).toContain("00:00.400-00:00.600");
  });
});
