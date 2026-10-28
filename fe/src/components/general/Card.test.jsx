import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Card from "./Card";

describe("Card", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <div data-testid="card-child">Child</div>
      </Card>
    );
    expect(screen.getByTestId("card-child")).toBeInTheDocument();
  });

  it("applies custom class names", () => {
    const { container } = render(<Card className="test-class">Content</Card>);
    expect(container.firstChild).toHaveClass("test-class");
  });

  it("renders as different component when 'as' prop is provided", () => {
    const { container } = render(<Card as="section">Content</Card>);
    expect(container.firstChild.tagName).toBe("SECTION");
  });
});
