import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import { AuthContext } from "@/context/AuthContext";

// Mock do módulo de configuração
jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock do Navigate para testar redirecionamentos
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Navigate: jest.fn((props) => {
    return null; // Retorna `null` para simular o comportamento do componente
  }),
}));

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders children when user is authenticated", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: true }}>
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Deve renderizar o conteúdo protegido
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  test("navigates to login when user is not authenticated", () => {
    render(
      <AuthContext.Provider value={{ isLoggedIn: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // O conteúdo protegido não deve ser renderizado
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();

    // Verificar que o Navigate foi chamado
    expect(Navigate).toHaveBeenCalledTimes(1);

    // Verificar o primeiro argumento da primeira chamada
    const firstArg = Navigate.mock.calls[0][0];
    expect(firstArg).toEqual(
      expect.objectContaining({
        to: "/login",
        replace: true,
      })
    );
  });
});
