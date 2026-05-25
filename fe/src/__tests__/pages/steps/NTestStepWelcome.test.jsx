import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NTestStepWelcome from "@/pages/user/steps/NTestStepWelcome";

describe("NTestStepWelcome", () => {
  it("shows error when required name is missing", () => {
    const onNext = vi.fn();
    const experiment = {
      basic: { name: "Teste", description: "Desc" },
      identification: { mode: "nome", required: true },
      participants: [],
    };

    render(<NTestStepWelcome experiment={experiment} onNext={onNext} />);

    fireEvent.submit(
      screen.getByRole("button", { name: /iniciar experimento/i }).closest("form"),
    );
    expect(
      screen.getByText(/informe seu nome para continuar/i),
    ).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("calls onNext when identification is not required", () => {
    const onNext = vi.fn();
    const experiment = {
      basic: { name: "Teste", description: "Desc" },
      identification: { mode: "nome", required: false },
      participants: [],
    };

    render(<NTestStepWelcome experiment={experiment} onNext={onNext} />);

    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).toHaveBeenCalledWith({ nome: "", cpf: "" });
  });
});
