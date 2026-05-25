import React from "react";
import { fireEvent, render } from "@testing-library/react";
import NTestStepCalibration from "@/pages/user/steps/NTestStepCalibration";
import { CALIBRATION_POINTS } from "@/utils/eyeTrackingMath";

describe("NTestStepCalibration", () => {
  it("alerts when face is not valid", () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { container } = render(
      <NTestStepCalibration
        faceValid={false}
        addCalibrationPoint={vi.fn()}
        onFinishCalibration={vi.fn()}
      />,
    );

    fireEvent.click(container.querySelector("button"));
    expect(alertMock).toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it("calls onFinishCalibration on last point", () => {
    const onFinishCalibration = vi.fn();

    const { container } = render(
      <NTestStepCalibration
        faceValid={true}
        addCalibrationPoint={vi.fn()}
        onFinishCalibration={onFinishCalibration}
      />,
    );

    for (let i = 0; i < CALIBRATION_POINTS.length; i += 1) {
      fireEvent.click(container.querySelector("button"));
    }

    expect(onFinishCalibration).toHaveBeenCalled();
  });
});
