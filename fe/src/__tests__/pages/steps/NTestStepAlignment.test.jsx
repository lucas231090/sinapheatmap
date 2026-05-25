import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import NTestStepAlignment from "@/pages/user/steps/NTestStepAlignment";

describe("NTestStepAlignment", () => {
  it("calls startCamera when button is clicked", () => {
    const startCamera = vi.fn();

    render(
      <NTestStepAlignment
        stream={null}
        mpLoaded={true}
        startCamera={startCamera}
        cameraActive={false}
        faceValid={false}
        onNext={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /ativar c.mera/i }));
    expect(startCamera).toHaveBeenCalled();
  });

  it("shows continue button after face is valid", () => {
    vi.useFakeTimers();

    render(
      <NTestStepAlignment
        stream={null}
        mpLoaded={true}
        startCamera={vi.fn()}
        cameraActive={true}
        faceValid={true}
        onNext={vi.fn()}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByRole("button", { name: /posi..o perfeita/i }),
    ).toBeInTheDocument();

    vi.useRealTimers();
  });
});
