import React from "react";
import { render, screen } from "@testing-library/react";
import Textarea from "@/components/general/Textarea";

describe("Textarea", () => {
  it("renders a textarea with placeholder", () => {
    render(<Textarea placeholder="Mensagem" />);
    expect(screen.getByPlaceholderText(/mensagem/i)).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(<Textarea error="Campo obrigatorio" />);
    expect(screen.getByText(/campo obrigatorio/i)).toBeInTheDocument();
  });
});
