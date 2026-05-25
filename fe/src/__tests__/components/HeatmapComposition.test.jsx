import React from "react";
import { render, screen } from "@testing-library/react";
import { HeatmapComposition } from "@/components/heatmap/HeatmapComposition";
import { useCurrentFrame, useVideoConfig } from "remotion";

vi.mock("@mars3d/heatmap.js", async () => ({
  create: vi.fn(() => ({
    setData: vi.fn(),
  })),
}));

vi.mock("remotion", async () => ({
  AbsoluteFill: ({ children }) => <div>{children}</div>,
  Video: () => <div data-testid="video" />,
  useCurrentFrame: vi.fn(),
  useVideoConfig: vi.fn(),
}));

describe("HeatmapComposition", () => {
  it("shows completion message when finished", () => {
    useCurrentFrame.mockReturnValue(200);
    useVideoConfig.mockReturnValue({ durationInFrames: 300, fps: 60 });

    const heatmapData = {
      coords: [
        { x: 10, y: 20, timestamp: 0 },
        { x: 30, y: 40, timestamp: 100 },
      ],
      canvasSize: { width: 200, height: 100 },
      radiusScale: 1,
      exposureSeconds: 1,
      durationMs: 1000,
    };

    render(<HeatmapComposition heatmapData={heatmapData} img="" type={0} />);

    expect(screen.getByText(/v.deo completo/i)).toBeInTheDocument();
  });
});
