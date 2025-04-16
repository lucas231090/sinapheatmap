/**
 * Testes para o componente FilePage
 * Verifica a funcionalidade de listagem, upload e desativação de arquivos
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FilePage from "../FilePage";
import { useFileContext } from "../../../context/FileContext";
import { deactivateFile } from "../../../services/fileService";

/**
 * Mock do componente FileUpload
 * Substitui o componente real por uma versão simplificada para os testes
 */
jest.mock("../../../components/FilePage/FileUpload", () => () => (
  <div data-testid="file-upload">FileUpload Component</div>
));

/**
 * Mock do componente FileList
 * Cria uma versão simplificada que expõe um botão para simular a ação de exclusão
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.files - Lista de arquivos a serem exibidos
 * @param {Function} props.abrirModal - Função para abrir o modal de confirmação
 */
jest.mock(
  "../../../components/FilePage/FileList",
  () =>
    ({ files, abrirModal }) =>
      (
        <div data-testid="file-list">
          FileList Component
          <button
            data-testid="delete-button"
            onClick={() => abrirModal("test-id")}
          >
            Delete File
          </button>
        </div>
      )
);

/**
 * Mock do componente CustomDialog (modal de confirmação)
 * Implementa um diálogo simples com botões que chamam as funções de callback
 * @param {Object} props - Propriedades do diálogo
 * @param {boolean} props.isOpen - Controla se o diálogo está visível
 * @param {Function} props.onClose - Função chamada ao fechar/cancelar
 * @param {Function} props.onConfirm - Função chamada ao confirmar a ação
 * @param {string} props.title - Título do diálogo
 * @param {string} props.message - Mensagem principal do diálogo
 */
jest.mock(
  "../../../components/General/CustomDialog",
  () =>
    ({ isOpen, onClose, onConfirm, title, message }) =>
      isOpen ? (
        <div data-testid="dialog">
          <h2>{title}</h2>
          <p>{message}</p>
          <button data-testid="cancel-button" onClick={() => onClose()}>
            Cancel
          </button>
          <button data-testid="confirm-button" onClick={() => onConfirm()}>
            Confirm
          </button>
        </div>
      ) : null
);

/**
 * Mock do componente Notification
 * Simula o sistema de notificações para testar sucesso/erro
 * @param {Object} props - Propriedades da notificação
 * @param {string} props.message - Texto da notificação
 * @param {string} props.type - Tipo da notificação (success, error, etc)
 * @param {Function} props.onClose - Função para fechar a notificação
 */
jest.mock(
  "../../../components/General/Notification",
  () =>
    ({ message, type, onClose }) =>
      message ? (
        <div data-testid="notification" className={type}>
          {message}
          <button data-testid="close-notification" onClick={onClose}>
            Close
          </button>
        </div>
      ) : null
);

/**
 * Mock do contexto de arquivos
 * Permite simular diferentes estados do contexto durante os testes
 */
jest.mock("../../../context/FileContext", () => ({
  useFileContext: jest.fn(),
}));

/**
 * Mock do serviço de arquivos
 * Substitui as chamadas de API reais por funções controladas pelos testes
 */
jest.mock("../../../services/fileService", () => ({
  deactivateFile: jest.fn(),
}));

describe("FilePage Component", () => {
  /**
   * Dados de arquivos de exemplo para os testes
   */
  const mockFiles = [
    { _id: "1", filename: "test1.csv" },
    { _id: "2", filename: "test2.csv" },
  ];

  /**
   * Funções mock para simular métodos do contexto
   */
  const mockFetchData = jest.fn();
  const mockShowNotification = jest.fn();

  /**
   * Configuração antes de cada teste
   * Limpa o histórico de chamadas e configura o estado inicial
   */
  beforeEach(() => {
    jest.clearAllMocks();

    // Configura o retorno do contexto de arquivos
    useFileContext.mockReturnValue({
      files: mockFiles, // Lista de arquivos simulada
      fetchData: mockFetchData, // Função para atualizar a lista
      showNotification: mockShowNotification, // Função para mostrar notificações
      notification: { message: "", type: "" }, // Estado inicial sem notificações
    });
  });

  /**
   * Teste para verificar o fluxo de desativação bem-sucedida de um arquivo
   */
  test("deactivates file when confirm is clicked", async () => {
    // Configura o mock para retornar sucesso
    deactivateFile.mockResolvedValueOnce({ success: true });

    // Renderiza o componente
    render(<FilePage />);

    // Abre o diálogo de confirmação clicando no botão de excluir
    fireEvent.click(screen.getByTestId("delete-button"));

    // Confirma a ação clicando no botão de confirmar
    fireEvent.click(screen.getByTestId("confirm-button"));

    // Espera a operação assíncrona completar e verifica os resultados
    await waitFor(() => {
      // Verifica se a API foi chamada com o ID correto
      expect(deactivateFile).toHaveBeenCalledWith("test-id");

      // Verifica se a lista foi atualizada
      expect(mockFetchData).toHaveBeenCalled();

      // Verifica se a notificação de sucesso foi exibida
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Arquivo atualizado com sucesso!",
        "success"
      );
    });

    // Verifica se o diálogo foi fechado após a operação
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  /**
   * Teste para verificar o tratamento de erro na desativação de arquivo
   */
  test("handles error when deactivating file fails", async () => {
    // Cria um erro de exemplo
    const testError = new Error("Failed to deactivate file");

    // Configura o mock para rejeitar com o erro
    deactivateFile.mockRejectedValueOnce(testError);

    // Renderiza o componente
    render(<FilePage />);

    // Abre o diálogo de confirmação
    fireEvent.click(screen.getByTestId("delete-button"));

    // Confirma a ação
    fireEvent.click(screen.getByTestId("confirm-button"));

    // Espera a operação assíncrona e verifica o tratamento de erro
    await waitFor(() => {
      // Verifica se a API foi chamada mesmo ocorrendo erro
      expect(deactivateFile).toHaveBeenCalledWith("test-id");

      // Verifica se a notificação de erro foi exibida com a mensagem correta
      expect(mockShowNotification).toHaveBeenCalledWith(
        testError.message || "Erro ao atualizar visibilidade do arquivo",
        "error"
      );
    });
  });
});
