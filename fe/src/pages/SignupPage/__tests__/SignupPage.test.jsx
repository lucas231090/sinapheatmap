/**
 * Teste unitário para o componente SignupPage
 * Testa o funcionamento do formulário de cadastro de usuários
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignupPage from "../SignupPage";
import { registerUser } from "../../../services/authService";

/**
 * Mock para o hook useNavigate do react-router-dom
 * Cria uma função simulada (mockNavigate) para verificar redirecionamentos
 */
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  // Mantém todas as funções originais do módulo
  ...jest.requireActual("react-router-dom"),
  // Sobrescreve apenas useNavigate para retornar nossa função mockada
  useNavigate: () => mockNavigate,
}));

/**
 * Mock para o serviço de autenticação
 * Permite simular a resposta da API sem fazer requisições reais
 */
jest.mock("../../../services/authService", () => ({
  registerUser: jest.fn(),
}));

describe("SignupPage Component", () => {
  /**
   * Antes de cada teste, limpa todos os mocks
   * Isso evita que chamadas de um teste afetem outro teste
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Testa se o formulário de cadastro envia os dados corretamente
   * e redireciona para a página de login após o sucesso
   */
  test("submits form with valid data using correct endpoint", async () => {
    // Configura o mock para retornar sucesso quando chamado
    registerUser.mockResolvedValueOnce({ success: true });

    // Renderiza o componente dentro do BrowserRouter (necessário para useNavigate)
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

    // Preenche o formulário com dados válidos simulando entrada do usuário
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar Senha"), {
      target: { value: "password123" },
    });

    // Simula o clique no botão de enviar
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    // Espera as operações assíncronas concluírem
    await waitFor(() => {
      // Verifica se a função registerUser foi chamada com os dados corretos
      expect(registerUser).toHaveBeenCalledWith(
        "Test User",
        "test@example.com",
        "password123"
      );

      // Verifica se houve redirecionamento para a página de login
      // com a mensagem de sucesso no state da navegação
      expect(mockNavigate).toHaveBeenCalledWith(
        "/login",
        expect.objectContaining({
          state: { message: "Cadastro realizado com sucesso! Faça o login." },
        })
      );
    });
  });
});
