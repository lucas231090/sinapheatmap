import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Layout from "../Layout";
import { AuthContext } from "../../context/AuthContext";

// Mock the config module before importing anything else
jest.mock("../../../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock do componente LoggedInHeader
jest.mock("../LoggedInHeader", () => ({ body }) => (
  <div data-testid="logged-in-header">{body}</div>
));

// Mock dos ícones do Material-UI
jest.mock("@mui/icons-material/WbSunny", () => () => (
  <div data-testid="sun-icon">SunIcon</div>
));
jest.mock("@mui/icons-material/DarkMode", () => () => (
  <div data-testid="dark-icon">DarkIcon</div>
));
jest.mock("@mui/icons-material/ExitToApp", () => () => (
  <div data-testid="exit-icon">ExitIcon</div>
));

// Mock do hook useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
}));

describe("Layout Component", () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Remover classes dark antes de cada teste
    document.documentElement.classList.remove("dark");
  });

  test("renders layout with children", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ isLoggedIn: true, logout: mockLogout }}>
          <Layout>
            <div data-testid="test-children">Test Children</div>
          </Layout>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByTestId("test-children")).toBeInTheDocument();
  });

  test("renders LoggedInHeader when user is authenticated", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ isLoggedIn: true, logout: mockLogout }}>
          <Layout>
            <div>Content</div>
          </Layout>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByTestId("logged-in-header")).toBeInTheDocument();
    expect(screen.getByTestId("exit-icon")).toBeInTheDocument(); // Botão de logout
  });

  test("does not render LoggedInHeader when user is not authenticated", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ isLoggedIn: false, logout: mockLogout }}>
          <Layout>
            <div>Content</div>
          </Layout>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByTestId("logged-in-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("exit-icon")).not.toBeInTheDocument(); // Sem botão de logout
  });

  test("toggles dark mode when button is clicked", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ isLoggedIn: true, logout: mockLogout }}>
          <Layout>
            <div>Content</div>
          </Layout>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Inicialmente deve mostrar o ícone de modo escuro (não está em modo escuro)
    expect(screen.getByTestId("dark-icon")).toBeInTheDocument();

    // Clicar no botão de alternar tema
    const themeToggleButton = screen.getByTestId("dark-icon").closest("button");
    fireEvent.click(themeToggleButton);

    // Agora deve adicionar a classe 'dark' ao documento e mostrar o ícone de sol
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();

    // Clicar novamente para voltar ao modo claro
    const lightThemeToggleButton = screen
      .getByTestId("sun-icon")
      .closest("button");
    fireEvent.click(lightThemeToggleButton);

    // A classe 'dark' deve ser removida
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  test("calls logout and navigates when logout button is clicked", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ isLoggedIn: true, logout: mockLogout }}>
          <Layout>
            <div>Content</div>
          </Layout>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Encontrar e clicar no botão de logout
    const logoutButton = screen.getByTestId("exit-icon").closest("button");
    fireEvent.click(logoutButton);

    // Verificar se a função de logout foi chamada
    expect(mockLogout).toHaveBeenCalled();
    // Verificar se navegou para a página de login
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
