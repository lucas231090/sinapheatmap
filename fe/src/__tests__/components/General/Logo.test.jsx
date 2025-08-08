import React from "react";
import { render, screen } from "@testing-library/react";
import Logo from "@/components/General/Logo";

describe("Logo", () => {
  test("renders logo with provided src", () => {
    const logoSrc = "/SinapsenseLogoDarkMode.png";

    render(<Logo logoSrc={logoSrc} />);

    const img = screen.getByAltText("Sinapsense Logo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", logoSrc);
  });

  test("renders default logo when no src provided", () => {
    render(<Logo logoSrc="" />);

    const img = screen.getByAltText("Sinapsense Logo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/SinapsenseLogo.png");
  });

  test("renders with correct CSS classes", () => {
    const { container } = render(<Logo logoSrc="/test-logo.png" />);

    const logoContainer = container.firstChild;
    expect(logoContainer).toHaveClass(
      "md:w-1/2",
      "flex",
      "justify-center",
      "items-center",
      "pb-6",
      "md:pr-6",
      "md:pb-0",
      "border-b",
      "border-gray-300",
      "dark:border-gray-500",
      "md:border-b-0",
      "md:border-r",
      "md:dark:border-gray-500"
    );

    const img = screen.getByAltText("Sinapsense Logo");
    expect(img).toHaveClass("h-30", "w-auto");
  });
});
