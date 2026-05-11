import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "@/components/General/LoginForm";

const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("LoginForm", () => {
  const defaultProps = {
    email: "",
    password: "",
    error: "",
    isLoading: false,
    onEmailChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onSubmit: jest.fn(),
    onErrorClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form elements correctly", () => {
    render(<LoginForm {...defaultProps} />, { wrapper });

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByText(/Não tem uma conta?/)).toBeInTheDocument();
    expect(screen.getByText("Registre-se")).toBeInTheDocument();
  });

  test("displays email and password values", () => {
    const props = {
      ...defaultProps,
      email: "test@example.com",
      password: "password123",
    };

    render(<LoginForm {...props} />, { wrapper });

    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("password123")).toBeInTheDocument();
  });

  test("calls onEmailChange when email input changes", () => {
    render(<LoginForm {...defaultProps} />, { wrapper });

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    expect(defaultProps.onEmailChange).toHaveBeenCalledWith("new@example.com");
  });

  test("calls onPasswordChange when password input changes", () => {
    render(<LoginForm {...defaultProps} />, { wrapper });

    const passwordInput = screen.getByLabelText("Senha");
    fireEvent.change(passwordInput, { target: { value: "newpassword" } });

    expect(defaultProps.onPasswordChange).toHaveBeenCalledWith("newpassword");
  });

  test("calls onSubmit when form is submitted", () => {
    render(<LoginForm {...defaultProps} />, { wrapper });

    const form = screen.getByRole("button", { name: "Entrar" }).closest("form");
    fireEvent.submit(form);

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  test("displays error message when error prop is provided", () => {
    const props = {
      ...defaultProps,
      error: "Login failed. Please try again.",
    };

    render(<LoginForm {...props} />, { wrapper });

    expect(
      screen.getByText("Login failed. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  test("calls onErrorClear when error clear button is clicked", () => {
    const props = {
      ...defaultProps,
      error: "Login failed. Please try again.",
    };

    render(<LoginForm {...props} />, { wrapper });

    const clearButton = screen.getByText("✕");
    fireEvent.click(clearButton);

    expect(defaultProps.onErrorClear).toHaveBeenCalled();
  });

  test("disables form elements when loading", () => {
    const props = {
      ...defaultProps,
      isLoading: true,
    };

    render(<LoginForm {...props} />, { wrapper });

    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Senha")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Entrando.../ })).toBeDisabled();
  });

  test("shows loading state in submit button", () => {
    const props = {
      ...defaultProps,
      isLoading: true,
    };

    render(<LoginForm {...props} />, { wrapper });

    expect(screen.getByText("Entrando...")).toBeInTheDocument();
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
  });

  test("signup link navigates to correct route", () => {
    render(<LoginForm {...defaultProps} />, { wrapper });

    const signupLink = screen.getByText("Registre-se");
    expect(signupLink).toHaveAttribute("href", "/signup");
  });
});
