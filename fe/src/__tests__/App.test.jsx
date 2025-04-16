import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock the config module before importing anything else
jest.mock("../../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock the auth context, including AuthProvider
jest.mock("../context/AuthContext", () => ({
  AuthContext: {
    Provider: ({ children }) => (
      <div data-testid="auth-provider">{children}</div>
    ),
  },
  useAuth: () => ({
    isLoggedIn: true,
    user: { name: "Test User" },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
  AuthProvider: ({ children }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

// Now it's safe to import App after mocking dependencies
import App from "../App";

// Mock the FileContext
jest.mock("../context/FileContext", () => ({
  FileProvider: ({ children }) => (
    <div data-testid="file-provider">{children}</div>
  ),
}));

// Mock the components used in App
jest.mock("../pages/FilePage/FilePage", () => () => (
  <div data-testid="file-page">FilePage</div>
));
jest.mock("../layout/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock("../pages/HeatmapStatic/HeatmapStatic", () => () => (
  <div data-testid="heatmap-static">HeatmapStatic</div>
));
jest.mock("../pages/LoginPage/LoginPage", () => () => (
  <div data-testid="login-page">LoginPage</div>
));
jest.mock("../pages/SignupPage/SignupPage", () => () => (
  <div data-testid="signup-page">SignupPage</div>
));
jest.mock(
  "../components/ProtectedRoute/ProtectedRoute",
  () =>
    ({ children }) =>
      children
);

// Mock React Router components to avoid navigation issues
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ path, element }) => (
    <div data-testid={`route-${path}`}>{element}</div>
  ),
  useNavigate: () => jest.fn(),
}));

describe("App Component", () => {
  test("renders App with providers", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Verifica se o Layout foi renderizado
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    // Verifica se o FileProvider está presente
    expect(screen.getByTestId("file-provider")).toBeInTheDocument();

    // Verifica se o AuthProvider está presente
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  test("renders with AuthProvider context", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Como estamos no caminho raiz "/" e o estado inicial isLoggedIn é true,
    // esperamos que o FilePage seja renderizado
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });
});
