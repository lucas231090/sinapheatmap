import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import BubbleCanvas from "@/components/heatmap/BubbleCanvas";

describe("BubbleCanvas", () => {
  it("shows the item and exact timestamp on hover", () => {
    render(
      <BubbleCanvas
        canvasSize={{ width: 100, height: 100 }}
        coords={[{ x: 10, y: 20, timestamp: 1234 }]}
        transformComponentRef={{ current: { state: { scale: 1 } } }}
      />,
    );

    fireEvent.mouseMove(screen.getByTestId("bubble-canvas-svg"), {
      clientX: 12,
      clientY: 22,
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Item 1");
    expect(screen.getByText(/00:01.234/)).toBeInTheDocument();
    expect(screen.getByText(/1234 ms/)).toBeInTheDocument();
  });

  it("hides the tooltip when the cursor is away from every bubble", () => {
    render(
      <BubbleCanvas
        canvasSize={{ width: 100, height: 100 }}
        coords={[{ x: 10, y: 20, timestamp: 1234 }]}
        transformComponentRef={{ current: { state: { scale: 1 } } }}
      />,
    );

    const svg = screen.getByTestId("bubble-canvas-svg");
    fireEvent.mouseMove(svg, { clientX: 12, clientY: 22 });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseMove(svg, { clientX: 90, clientY: 90 });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseMove(svg, { clientX: 12, clientY: 22 });
    fireEvent.mouseLeave(svg);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
