import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NTestStepTutorial from "@/pages/user/steps/NTestStepTutorial";

describe("NTestStepTutorial", () => {
  it("renders tutorial and calls onNext", () => {
    const onNext = vi.fn();
    render(<NTestStepTutorial onNext={onNext} />);

    expect(screen.getByText(/como funcionará o teste/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /entendi/i }));

    expect(onNext).toHaveBeenCalled();
  });
});
