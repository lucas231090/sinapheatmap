import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Button from "@/components/general/Button";

describe("Button component", () => {
  it("renders a regular button by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("renders a link when asLink is true", () => {
    render(
      <BrowserRouter>
        <Button asLink to="/test">
          Go somewhere
        </Button>
      </BrowserRouter>
    );
    const link = screen.getByRole("link", { name: /go somewhere/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("applies the disabled state correctly", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
  });
});
