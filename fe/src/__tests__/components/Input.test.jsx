import React from "react";
import { render, screen } from "@testing-library/react";
import Input from "@/components/general/Input";

describe("Input component", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(<Input placeholder="Enter text" error="Invalid input" />);
    const errorMessage = screen.getByText("Invalid input");
    expect(errorMessage).toBeInTheDocument();
  });
});
