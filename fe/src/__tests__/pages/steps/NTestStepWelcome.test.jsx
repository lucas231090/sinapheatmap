import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NTestStepWelcome from "@/pages/user/steps/NTestStepWelcome";
import { vi } from "vitest";

describe("NTestStepWelcome", () => {
  it("renders experiment name and description", () => {
    const onNext = vi.fn();
    const experiment = {
      basic: { name: "Teste LGPD", description: "Descricao LGPD" },
    };

    render(<NTestStepWelcome experiment={experiment} onNext={onNext} />);

    expect(screen.getByText("Teste LGPD")).toBeInTheDocument();
    expect(screen.getByText("Descricao LGPD")).toBeInTheDocument();
  });

  it("calls onNext when starting experiment", () => {
    const onNext = vi.fn();
    const experiment = {
      basic: { name: "Teste", description: "Desc" },
    };

    render(<NTestStepWelcome experiment={experiment} onNext={onNext} />);

    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).toHaveBeenCalled();
  });
});
