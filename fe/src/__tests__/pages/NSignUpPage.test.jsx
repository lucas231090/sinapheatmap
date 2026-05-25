import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NSignUpPage from "@/pages/user/NSignUpPage";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

vi.mock("@/hooks/useAuth");
vi.mock("@/hooks/useNotifications");

describe("NSignUpPage", async () => {
  const mockSignUp = vi.fn();
  const mockNotifyError = vi.fn();
  const mockNotifySuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      signUp: mockSignUp,
      isLoading: false,
    });
    useNotifications.mockReturnValue({
      notifyError: mockNotifyError,
      notifySuccess: mockNotifySuccess,
    });
  });

  it("renders sign up form correctly", () => {
    render(
      <MemoryRouter>
        <NSignUpPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /cadastro/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    render(
      <MemoryRouter>
        <NSignUpPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(mockNotifyError).toHaveBeenCalledWith(
      "Confira os campos do cadastro antes de continuar."
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp and redirects on successful submission", async () => {
    mockSignUp.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <NSignUpPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
      expect(mockNotifySuccess).toHaveBeenCalledWith(
        "Conta criada com sucesso. Faça login para continuar."
      );
    });
  });
});
