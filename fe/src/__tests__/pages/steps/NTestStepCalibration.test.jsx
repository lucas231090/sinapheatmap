import React from "react";
import { act, render, screen } from "@testing-library/react";
import NTestStepCalibration from "@/pages/user/steps/NTestStepCalibration";
import { CALIBRATION_POINTS } from "@/utils/eyeTrackingMath";

describe("NTestStepCalibration", () => {
  it("shows a message when face is not valid", () => {
    render(
      <NTestStepCalibration
        faceValid={false}
        addCalibrationPoint={vi.fn()}
        onFinishCalibration={vi.fn()}
      />,
    );

    expect(screen.getByText(/c.mera perdeu seu rosto/i)).toBeInTheDocument();
  });

  it("calls onFinishCalibration on last point", async () => {
    vi.useFakeTimers();
    const onFinishCalibration = vi.fn();

    render(
      <NTestStepCalibration
        faceValid={true}
        addCalibrationPoint={vi.fn()}
        clearFrameBuffer={vi.fn()}
        onFinishCalibration={onFinishCalibration}
      />,
    );

    for (let i = 0; i < CALIBRATION_POINTS.length; i += 1) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
    }

    expect(onFinishCalibration).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
