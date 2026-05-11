import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignupForm from "@/components/General/SignupForm";

// Mock the config module
jest.mock("@/../config", () => ({
  default: {
    API_BASE_URL: "http://api.example.com",
  },
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("SignupForm", () => {
  const defaultProps = {
    formData: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    error: "",
    isLoading: false,
    onFieldChange: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all form fields", () => {
    renderWithRouter(<SignupForm {...defaultProps} />);

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar Senha")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar" })
    ).toBeInTheDocument();
  });

  it("should display form data correctly", () => {
    const formData = {
      name: "João",
      email: "joao@test.com",
      password: "senha123",
      confirmPassword: "senha456",
    };

    renderWithRouter(<SignupForm {...defaultProps} formData={formData} />);

    expect(screen.getByDisplayValue("João")).toBeInTheDocument();
    expect(screen.getByDisplayValue("joao@test.com")).toBeInTheDocument();

    // Use more specific selectors for password fields
    const passwordInput = screen.getByLabelText("Senha");
    const confirmPasswordInput = screen.getByLabelText("Confirmar Senha");

    expect(passwordInput).toHaveValue("senha123");
    expect(confirmPasswordInput).toHaveValue("senha456");
  });

  it("should call onFieldChange when input values change", () => {
    const onFieldChange = jest.fn();

    renderWithRouter(
      <SignupForm {...defaultProps} onFieldChange={onFieldChange} />
    );

    const nameInput = screen.getByLabelText("Nome");
    fireEvent.change(nameInput, { target: { value: "João" } });

    expect(onFieldChange).toHaveBeenCalledWith("name", "João");
  });

  it("should call onSubmit when form is submitted", () => {
    const onSubmit = jest.fn();

    renderWithRouter(<SignupForm {...defaultProps} onSubmit={onSubmit} />);

    const form = screen
      .getByRole("button", { name: "Registrar" })
      .closest("form");
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalled();
  });

  it("should display error message when error prop is provided", () => {
    renderWithRouter(
      <SignupForm {...defaultProps} error="As senhas não coincidem" />
    );

    expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
  });

  it("should disable form when loading", () => {
    renderWithRouter(<SignupForm {...defaultProps} isLoading={true} />);

    expect(screen.getByLabelText("Nome")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Senha")).toBeDisabled();
    expect(screen.getByLabelText("Confirmar Senha")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Registrando..." })
    ).toBeDisabled();
  });

  it("should show loading text in button when loading", () => {
    renderWithRouter(<SignupForm {...defaultProps} isLoading={true} />);

    expect(
      screen.getByRole("button", { name: "Registrando..." })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Registrar" })
    ).not.toBeInTheDocument();
  });

  it("should render login link", () => {
    renderWithRouter(<SignupForm {...defaultProps} />);

    const loginLink = screen.getByRole("link", { name: "Faça login" });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
