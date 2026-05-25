import React from "react";
import { render, screen } from "@testing-library/react";
import NTestStepRunner from "@/pages/user/steps/NTestStepRunner";

vi.mock("@/utils/eyeTrackingMath", async () => ({
  shuffleArray: (items) => items,
}));

vi.mock("@/services/fileService", async () => ({
  getFileMedia: vi.fn(() => Promise.resolve("")),
}));

vi.mock("@/services/api", async () => ({
  getPublicMediaUrl: vi.fn((value) => value),
}));

describe("NTestStepRunner", () => {
  it("renders countdown", () => {
    const experiment = {
      samples: [],
      pieces: [],
      organization: { randomizeSamples: false, randomizePieces: false },
    };

    render(
      <NTestStepRunner
        experiment={experiment}
        getCurrentGaze={vi.fn()}
        faceValid={true}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
