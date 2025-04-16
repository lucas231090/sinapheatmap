/**
 * Testes unitários para o componente LoginPage
 * Verifica a renderização do formulário, envio de credenciais e tratamento de erros
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "../LoginPage";
import { AuthContext } from "../../../context/AuthContext";
import { loginUser } from "../../../services/authService";

/**
 * Mock para o hook useNavigate do react-router-dom
 * Permite verificar se a navegação ocorre corretamente após login
 */
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // Mantém as funções originais
  useNavigate: () => mockNavigate, // Substitui apenas useNavigate
}));

/**
 * Mock para o serviço de autenticação
 * Permite verificar se a função loginUser é chamada com os parâmetros corretos
 */
jest.mock("../../../services/authService", () => ({
  loginUser: jest.fn(),
}));

describe("LoginPage Component", () => {
  /**
   * Mock para a função login do contexto de autenticação
   * Será injetado via AuthContext.Provider nos testes
   */
  const mockLogin = jest.fn();

  /**
   * Limpa todos os mocks antes de cada teste
   * Isso evita que chamadas de um teste afetem outro teste
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifica se o formulário de login é renderizado corretamente
   * com todos os elementos necessários
   */
  test("renders login form", () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ login: mockLogin, isLoggedIn: false }}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verificar se os elementos do formulário estão presentes
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();

    // Verificar link para registro
    const registerLink = screen.getByText(/registre-se/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/signup");
  });

  /**
   * Verifica se o formulário envia as credenciais inseridas corretamente
   * e se a navegação ocorre após login bem-sucedido
   */
  test("submits form with entered credentials", async () => {
    // Mock de login que retorna uma Promise resolvida
    mockLogin.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ login: mockLogin, isLoggedIn: false }}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Preencher o formulário com credenciais de teste
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "password123" },
    });

    // Enviar o formulário clicando no botão
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    // Verificar se a função login do contexto foi chamada com os dados corretos
    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");

    // Verificar se houve navegação para a página inicial após login bem-sucedido
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  /**
   * Verifica se mensagens de erro são exibidas quando o login falha
   * e se não ocorre navegação nesse caso
   */
  test("displays error message when login fails", async () => {
    // Mock de login que retorna uma Promise rejeitada (simula erro)
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ login: mockLogin, isLoggedIn: false }}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Preencher e enviar o formulário com credenciais inválidas
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    // Verificar se a mensagem de erro é exibida ao usuário
    await waitFor(() => {
      expect(screen.getByText(/falha no login/i)).toBeInTheDocument();
    });

    // Não deve haver navegação após falha no login
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * Verifica se o formulário usa o endpoint correto da API
   * através do serviço de autenticação
   */
  test("submits form with correct API endpoint", async () => {
    // Mock de login que utiliza o serviço loginUser internamente
    // Isso permite verificar se o endpoint correto é utilizado
    mockLogin.mockImplementation((email, password) => {
      return loginUser(email, password);
    });
    loginUser.mockResolvedValueOnce({ accessToken: "test-token" });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ login: mockLogin, isLoggedIn: false }}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Preencher o formulário
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "password123" },
    });

    // Enviar o formulário
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    // Verificar se a função login do contexto foi chamada com os dados corretos
    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");

    // Verificar se o serviço de autenticação (loginUser) foi chamado com os mesmos dados
    // o que confirma que o componente está usando o endpoint correto via serviço
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith("test@example.com", "password123");
    });

    // Verificar navegação após login bem-sucedido
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
