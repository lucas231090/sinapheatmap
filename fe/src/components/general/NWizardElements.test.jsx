import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ActionButton,
  InputField,
  TextAreaField,
  SectionTitle,
  CardPanel,
  RowCard,
} from "./NWizardElements";

describe("NWizardElements", () => {
  describe("ActionButton", () => {
    it("renders children correctly", () => {
      render(<ActionButton>Click Me</ActionButton>);
      expect(screen.getByText("Click Me")).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<ActionButton onClick={handleClick}>Click Me</ActionButton>);
      fireEvent.click(screen.getByText("Click Me"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when disabled prop is passed", () => {
      render(<ActionButton disabled>Click Me</ActionButton>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("InputField", () => {
    it("renders label and input", () => {
      render(<InputField label="Test Label" placeholder="Test Placeholder" />);
      expect(screen.getByText("Test Label")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Test Placeholder")).toBeInTheDocument();
    });
  });

  describe("TextAreaField", () => {
    it("renders label and textarea", () => {
      render(<TextAreaField label="Test Textarea" placeholder="Enter text" />);
      expect(screen.getByText("Test Textarea")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });
  });

  describe("SectionTitle", () => {
    it("renders all elements correctly", () => {
      render(
        <SectionTitle
          kicker="Test Kicker"
          title="Test Title"
          description="Test Description"
        />
      );
      expect(screen.getByText("Test Kicker")).toBeInTheDocument();
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });
  });

  describe("CardPanel", () => {
    it("renders children correctly", () => {
      render(<CardPanel><div>Card Content</div></CardPanel>);
      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });
  });

  describe("RowCard", () => {
    it("renders title, subtitle and badge", () => {
      render(
        <RowCard
          title="Row Title"
          subtitle="Row Subtitle"
          badge="Row Badge"
        />
      );
      expect(screen.getByText("Row Title")).toBeInTheDocument();
      expect(screen.getByText("Row Subtitle")).toBeInTheDocument();
      expect(screen.getByText("Row Badge")).toBeInTheDocument();
    });

    it("calls action callbacks", () => {
      const handleMoveLeft = vi.fn();
      const handleMoveRight = vi.fn();
      const handleDelete = vi.fn();

      render(
        <RowCard
          title="Test"
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onDelete={handleDelete}
        />
      );

      const buttons = screen.getAllByRole("button");
      // buttons[0] is move left, buttons[1] is move right, buttons[2] is delete
      fireEvent.click(buttons[0]);
      expect(handleMoveLeft).toHaveBeenCalledTimes(1);

      fireEvent.click(buttons[1]);
      expect(handleMoveRight).toHaveBeenCalledTimes(1);

      fireEvent.click(buttons[2]);
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });
  });
});
