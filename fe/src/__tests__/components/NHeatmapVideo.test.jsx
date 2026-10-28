import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NHeatmapVideo from "@/components/heatmap/NHeatmapVideo";

vi.mock("@remotion/player", async () => ({
  Player: () => <div data-testid="player" />,
}));

describe("NHeatmapVideo", () => {
  it("renders player and updates speed", async () => {
    render(
      <NHeatmapVideo
        coords={[{ x: 10, y: 10, timestamp: 0 }]}
        canvasSize={{ width: 300, height: 200 }}
        radiusScale={1}
        mediaUrl="blob:test"
        exposureSeconds={10}
        captureFps={60}
        durationMs={1000}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("player")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2" } });
    expect(select.value).toBe("2");
  });
});
