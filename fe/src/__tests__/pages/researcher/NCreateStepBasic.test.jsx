import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NCreateStepBasic from "@/pages/researcher/NCreatePage/components/NCreateStepBasic";

describe("NCreateStepBasic", () => {
  it("renders fields and handles navigation", () => {
    const onNext = vi.fn();
    const onReset = vi.fn();

    render(
      <NCreateStepBasic
        basic={{
          name: "",
          startDate: "",
          endDate: "",
          description: "",
          showDescriptionOnTest: false,
          allowMultipleSessions: false,
        }}
        onFieldChange={vi.fn()}
        onReset={onReset}
        onNext={onNext}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /pr.ximo/i }));
    expect(onNext).toHaveBeenCalled();
  });
});
