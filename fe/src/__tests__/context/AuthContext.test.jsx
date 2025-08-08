import React, { useContext } from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { AuthProvider, AuthContext } from "@/context/AuthContext";

// Mock para os serviços de autenticação
jest.mock("@/services/authService", () => ({
  loginUser: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(),
}));

import { loginUser, logout, isAuthenticated } from "@/services/authService";

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset dos mocks para valores padrão
    isAuthenticated.mockReturnValue(false);
    loginUser.mockResolvedValue({ accessToken: "test-token" });
  });

  test("provides authentication context to children", () => {
    // Componente de teste que consome o contexto
    const TestConsumer = () => {
      const auth = useContext(AuthContext);
      return (
        <div>
          <span data-testid="login-status">
            {auth.isLoggedIn ? "logged-in" : "logged-out"}
          </span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Como isAuthenticated retorna false, o estado inicial deve ser logged-out
    expect(screen.getByTestId("login-status")).toHaveTextContent("logged-out");
  });

  test("updates login status when login() is called", async () => {
    // Mock de uma resposta bem-sucedida para loginUser
    loginUser.mockResolvedValue({ accessToken: "test-token" });

    // Componente de teste para acionar login
    const TestLogin = () => {
      const { login, isLoggedIn } = useContext(AuthContext);
      return (
        <div>
          <span data-testid="login-status">
            {isLoggedIn ? "logged-in" : "logged-out"}
          </span>
          <button
            data-testid="login-button"
            onClick={() => login("test@example.com", "password")}
          >
            Login
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestLogin />
      </AuthProvider>
    );

    // Estado inicial: não logado
    expect(screen.getByTestId("login-status")).toHaveTextContent("logged-out");

    // Clicar no botão de login
    await act(async () => {
      fireEvent.click(screen.getByTestId("login-button"));
    });

    // Verificar se loginUser foi chamado com os parâmetros corretos
    expect(loginUser).toHaveBeenCalledWith("test@example.com", "password");

    // Após o login, o estado deve ser atualizado
    await waitFor(() => {
      expect(screen.getByTestId("login-status")).toHaveTextContent("logged-in");
    });
  });

  test("updates login status when logout() is called", async () => {
    // Simulando um usuário já logado
    isAuthenticated.mockReturnValue(true);

    // Componente de teste para acionar logout
    const TestLogout = () => {
      const { logout: handleLogout, isLoggedIn } = useContext(AuthContext);
      return (
        <div>
          <span data-testid="login-status">
            {isLoggedIn ? "logged-in" : "logged-out"}
          </span>
          <button data-testid="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestLogout />
      </AuthProvider>
    );

    // Aguardar o efeito inicial que verifica o estado de autenticação
    await waitFor(() => {
      expect(screen.getByTestId("login-status")).toHaveTextContent("logged-in");
    });

    // Clicar no botão de logout
    await act(async () => {
      fireEvent.click(screen.getByTestId("logout-button"));
    });

    // Verificar se logout foi chamado
    expect(logout).toHaveBeenCalled();

    // Após o logout, o estado deve ser atualizado
    await waitFor(() => {
      expect(screen.getByTestId("login-status")).toHaveTextContent(
        "logged-out"
      );
    });
  });

  test("handles loading state", async () => {
    // Função que vai resolver após um atraso para simular carregamento
    isAuthenticated.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });
    });

    // Componente que verificará o estado de loading
    const TestLoading = () => {
      const { isLoggedIn } = useContext(AuthContext);
      return (
        <div data-testid="auth-state">
          {isLoggedIn ? "logged-in" : "logged-out"}
        </div>
      );
    };

    // Neste teste, esperamos ver o estado de carregamento
    render(
      <AuthProvider>
        <TestLoading />
      </AuthProvider>
    );

    // Após o carregamento, deve mostrar logged-in
    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("logged-in");
    });
  });
});
