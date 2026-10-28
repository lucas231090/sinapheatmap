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

  it("handles toggling requireGender and requireAge options", () => {
    const onFieldChange = vi.fn();

    render(
      <NCreateStepBasic
        basic={{
          name: "Test",
          startDate: "",
          endDate: "",
          description: "",
          showDescriptionOnTest: false,
          allowMultipleSessions: false,
          requireGender: false,
          requireAge: false,
        }}
        onFieldChange={onFieldChange}
        onReset={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText(/coletar g.nero do participante/i));
    expect(onFieldChange).toHaveBeenCalledWith("requireGender", true);

    fireEvent.click(screen.getByLabelText(/coletar idade do participante/i));
    expect(onFieldChange).toHaveBeenCalledWith("requireAge", true);
  });
});
