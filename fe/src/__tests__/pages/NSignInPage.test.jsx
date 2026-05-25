import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NSignInPage from "@/pages/user/NSignInPage";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

vi.mock("@/hooks/useAuth");
vi.mock("@/hooks/useNotifications");

describe("NSignInPage", async () => {
  const mockSignIn = vi.fn();
  const mockNotifyError = vi.fn();
  const mockNotifySuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
      isAuthenticated: false,
      hasHydrated: true,
    });
    useNotifications.mockReturnValue({
      notifyError: mockNotifyError,
      notifySuccess: mockNotifySuccess,
    });
  });

  it("renders sign in form correctly", () => {
    render(
      <MemoryRouter>
        <NSignInPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    render(
      <MemoryRouter>
        <NSignInPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    expect(mockNotifyError).toHaveBeenCalledWith(
      "Preencha os campos obrigatorios para continuar."
    );
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls signIn and redirects on successful submission", async () => {
    mockSignIn.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <NSignInPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockNotifySuccess).toHaveBeenCalledWith("Login realizado com sucesso.");
    });
  });
});
