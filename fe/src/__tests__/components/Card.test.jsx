import React from "react";
import { render, screen } from "@testing-library/react";
import Card from "@/components/general/Card";

describe("Card component", () => {
  it("renders children inside a div wrapper", () => {
    render(
      <Card>
        <p>Card Content</p>
      </Card>
    );
    const content = screen.getByText("Card Content");
    expect(content).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="my-custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});
