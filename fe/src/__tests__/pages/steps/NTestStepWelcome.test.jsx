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
    expect(onNext).toHaveBeenCalledWith({ idade: null, genero: null });
  });

  it("validates age and gender when required", () => {
    const onNext = vi.fn();
    const experiment = {
      basic: {
        name: "Teste Demográfico",
        description: "Desc",
        requireAge: true,
        requireGender: true,
      },
    };

    render(<NTestStepWelcome experiment={experiment} onNext={onNext} />);

    // Attempt to start without filling fields
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/informe uma idade v.lida/i)).toBeInTheDocument();

    // Fill age
    fireEvent.change(screen.getByLabelText(/idade \*/i), {
      target: { value: "28" },
    });

    // Attempt start without gender
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/selecione seu g.nero/i)).toBeInTheDocument();

    // Select gender
    fireEvent.change(screen.getByLabelText(/g.nero \*/i), {
      target: { value: "Feminino" },
    });

    // Start successfully
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).toHaveBeenCalledWith({ idade: 28, genero: "Feminino" });
  });
});
