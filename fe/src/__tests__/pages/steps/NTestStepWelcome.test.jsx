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
    fireEvent.change(screen.getByLabelText(/qual . sua idade/i), {
      target: { value: "28" },
    });

    // Check that 'Prefiro não informar' option was removed
    expect(
      screen.queryByRole("option", { name: /prefiro n.o informar/i }),
    ).not.toBeInTheDocument();

    // Attempt start without gender
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/selecione seu g.nero/i)).toBeInTheDocument();

    // Select standard gender
    fireEvent.change(screen.getByLabelText(/qual g.nero voc. se identifica/i), {
      target: { value: "Feminino" },
    });

    // Start successfully with standard gender
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).toHaveBeenCalledWith({ idade: 28, genero: "Feminino" });
  });

  it("handles 'Outro' gender with custom text input", () => {
    const onNext = vi.fn();
    const experiment = {
      basic: {
        name: "Teste Custom Genero",
        requireAge: true,
        requireGender: true,
      },
    };

    render(<NTestStepWelcome experiment={experiment} onNext={onNext} />);

    // Fill age
    fireEvent.change(screen.getByLabelText(/qual . sua idade/i), {
      target: { value: "32" },
    });

    // Select 'Outro'
    fireEvent.change(screen.getByLabelText(/qual g.nero voc. se identifica/i), {
      target: { value: "Outro" },
    });

    // Attempt to start without filling custom input
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).not.toHaveBeenCalled();
    expect(
      screen.getByText(/informe com qual g.nero voc. se identifica/i),
    ).toBeInTheDocument();

    // Fill custom gender
    const customInput = screen.getByPlaceholderText(
      /escreva qual g.nero voc. se identifica/i,
    );
    fireEvent.change(customInput, {
      target: { value: "Agênero" },
    });

    // Start successfully
    fireEvent.click(
      screen.getByRole("button", { name: /iniciar experimento/i }),
    );
    expect(onNext).toHaveBeenCalledWith({ idade: 32, genero: "Agênero" });
  });
});
