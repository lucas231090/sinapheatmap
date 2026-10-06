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

    fireEvent.mouseEnter(screen.getByLabelText("Bolha 1"));

    expect(screen.getByText(/00:01.234/)).toBeInTheDocument();
    expect(screen.getByText(/1234 ms/)).toBeInTheDocument();
  });
});
