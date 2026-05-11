/**
 * Teste do contexto FileContext
 *
 * Verifica se o contexto gerencia corretamente:
 * - Carregamento de arquivos
 * - Exibição de notificações
 * - Tratamento de erros
 * - Atualização de dados
 */
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileProvider, useFileContext } from "@/context/FileContext";
import { getAllFiles } from "@/services/fileService";

// Mock do módulo de configuração
jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock do serviço de arquivos
jest.mock("@/services/fileService", () => ({
  getAllFiles: jest.fn(),
}));

/**
 * Componente de teste que usa o contexto FileContext
 * Permite verificar se os valores e funções do contexto estão funcionando
 */
function TestConsumer() {
  const {
    files,
    loading,
    fetchData,
    showNotification,
    notification,
    clearNotification,
  } = useFileContext();

  return (
    <div>
      {/* Status de carregamento */}
      <div data-testid="loading-status">{loading ? "Loading" : "Idle"}</div>

      {/* Contador de arquivos */}
      <div data-testid="file-count">{files.length}</div>

      {/* Lista de arquivos */}
      <ul>
        {files.map((file) => (
          <li key={file._id} data-testid="file-item">
            {file.filename}
          </li>
        ))}
      </ul>

      {/* Botão para buscar dados novamente */}
      <button data-testid="fetch-button" onClick={fetchData}>
        Fetch Data
      </button>

      {/* Botão para mostrar uma notificação de sucesso */}
      <button
        data-testid="success-notification-button"
        onClick={() => showNotification("Operation successful", "success")}
      >
        Show Success
      </button>

      {/* Botão para mostrar uma notificação de erro */}
      <button
        data-testid="error-notification-button"
        onClick={() => showNotification("Operation failed", "error")}
      >
        Show Error
      </button>

      {/* Botão para limpar notificação manualmente */}
      <button
        data-testid="clear-notification-button"
        onClick={clearNotification}
      >
        Clear Notification
      </button>

      {/* Área de notificação */}
      <div data-testid="notification-area">
        {notification && (
          <>
            <div data-testid="notification-message">
              {notification.message || ""}
            </div>
            <div data-testid="notification-type">{notification.type || ""}</div>
          </>
        )}
      </div>
    </div>
  );
}

describe("FileContext", () => {
  // Dados de teste
  const mockFiles = [
    { _id: "file1", filename: "document1.csv", active: true },
    { _id: "file2", filename: "document2.csv", active: true },
  ];

  const updatedMockFiles = [
    ...mockFiles,
    { _id: "file3", filename: "document3.csv", active: true },
  ];

  // Configuração antes de cada teste
  beforeEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();

    // Configurar mocks de tempo para testes de temporizadores
    jest.useFakeTimers();

    // Configurar resposta padrão para o serviço de arquivos
    getAllFiles.mockResolvedValue(mockFiles);
  });

  // Limpeza após cada teste
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Helper para renderizar o componente de teste dentro do provider
   */
  const renderWithProvider = () => {
    return render(
      <FileProvider>
        <TestConsumer />
      </FileProvider>
    );
  };

  /**
   * Teste 1: O provider deve carregar os arquivos na montagem
   */
  it("should load files on mount", async () => {
    // Renderizar o componente
    await act(async () => {
      renderWithProvider();
    });

    // Verificar se o serviço foi chamado
    expect(getAllFiles).toHaveBeenCalledTimes(1);

    // Verificar se os arquivos foram carregados
    expect(screen.getByTestId("file-count")).toHaveTextContent("2");

    // Verificar se cada arquivo está na lista
    const fileItems = screen.getAllByTestId("file-item");
    expect(fileItems).toHaveLength(2);
    expect(fileItems[0]).toHaveTextContent("document1.csv");
    expect(fileItems[1]).toHaveTextContent("document2.csv");
  });

  /**
   * Teste 2: Deve mostrar e limpar notificações adequadamente
   */
  it("should show and clear notifications", async () => {
    // Aumentar o timeout específico para este teste
    jest.setTimeout(10000);

    // Renderizar o componente
    await act(async () => {
      renderWithProvider();
    });

    // Verificar estado inicial (sem notificação)
    const messageElement = screen.getByTestId("notification-message");
    const typeElement = screen.getByTestId("notification-type");
    expect(messageElement).toBeEmptyDOMElement();
    expect(typeElement).toBeEmptyDOMElement();

    // PARTE 1: TESTAR NOTIFICAÇÃO DE SUCESSO
    // -------------------------------------
    // Mostrar notificação de sucesso
    const successButton = screen.getByTestId("success-notification-button");

    await act(async () => {
      userEvent.click(successButton);
    });

    // Usar waitFor para garantir que o estado foi atualizado
    await waitFor(() => {
      expect(messageElement).toHaveTextContent("Operation successful");
      expect(typeElement).toHaveTextContent("success");
    });

    // Avançar tempo para verificar limpeza automática
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Verificar limpeza da notificação
    await waitFor(() => {
      expect(messageElement).toBeEmptyDOMElement();
      expect(typeElement).toBeEmptyDOMElement();
    });

    // PARTE 2: TESTAR NOTIFICAÇÃO DE ERRO
    // ---------------------------------
    // Mostrar notificação de erro
    const errorButton = screen.getByTestId("error-notification-button");

    await act(async () => {
      userEvent.click(errorButton);
    });

    // Usar waitFor para garantir que o estado foi atualizado
    await waitFor(() => {
      expect(messageElement).toHaveTextContent("Operation failed");
      expect(typeElement).toHaveTextContent("error");
    });

    // PARTE 3: TESTAR LIMPEZA MANUAL
    // ---------------------------
    // Limpar manualmente
    const clearButton = screen.getByTestId("clear-notification-button");

    await act(async () => {
      userEvent.click(clearButton);
    });

    // Verificar que a notificação foi limpa
    await waitFor(() => {
      expect(messageElement).toBeEmptyDOMElement();
      expect(typeElement).toBeEmptyDOMElement();
    });
  }, 10000);

  /**
   * Teste 3: Deve tratar erros durante o carregamento inicial
   */
  it("should handle errors during initial load", async () => {
    // Configurar falha na API
    const errorMsg = "Failed to fetch files";
    const testError = new Error(errorMsg);
    getAllFiles.mockRejectedValueOnce(testError);

    // Renderizar o componente
    await act(async () => {
      renderWithProvider();
    });

    // Verificar se o serviço foi chamado
    expect(getAllFiles).toHaveBeenCalledTimes(1);

    // Verificar se a notificação de erro foi mostrada
    expect(screen.getByTestId("notification-message")).toHaveTextContent(
      errorMsg
    );
    expect(screen.getByTestId("notification-type")).toHaveTextContent("error");
  });

  /**
   * Teste 4: Deve atualizar a lista de arquivos quando fetchData é chamado
   */
  it("should update file list when fetchData is called", async () => {
    // Renderizar o componente
    await act(async () => {
      renderWithProvider();
    });

    // Verificar carga inicial
    expect(screen.getByTestId("file-count")).toHaveTextContent("2");
    expect(getAllFiles).toHaveBeenCalledTimes(1);

    // Preparar próxima resposta com lista atualizada
    getAllFiles.mockResolvedValueOnce(updatedMockFiles);

    // Acionar atualização dos dados
    const fetchButton = screen.getByTestId("fetch-button");
    await act(async () => {
      userEvent.click(fetchButton);
    });

    // Verificar que o serviço foi chamado novamente
    expect(getAllFiles).toHaveBeenCalledTimes(1);

    // Verificar que a lista foi atualizada
    await waitFor(() => {
      expect(screen.getByTestId("file-count")).toHaveTextContent("3");
    });

    // Verificar que todos os itens estão presentes
    const fileItems = screen.getAllByTestId("file-item");
    expect(fileItems).toHaveLength(3);
    expect(fileItems[2]).toHaveTextContent("document3.csv");
  });

  /**
   * Teste 5: Deve tratar erros durante a atualização dos dados
   */
  it("should handle errors during data refresh", async () => {
    // Renderizar o componente
    await act(async () => {
      renderWithProvider();
    });

    // Verificar carga inicial
    expect(getAllFiles).toHaveBeenCalledTimes(1);

    // Preparar erro para a próxima chamada
    const updateErrorMsg = "Failed to update data";
    getAllFiles.mockRejectedValueOnce(new Error(updateErrorMsg));

    // Acionar atualização dos dados
    const fetchButton = screen.getByTestId("fetch-button");
    await act(async () => {
      userEvent.click(fetchButton);
    });

    // Verificar que o serviço foi chamado novamente
    expect(getAllFiles).toHaveBeenCalledTimes(1);

    // Verificar que a notificação de erro foi mostrada
    await waitFor(() => {
      expect(screen.getByTestId("notification-message")).toHaveTextContent(
        updateErrorMsg
      );
      expect(screen.getByTestId("notification-type")).toHaveTextContent(
        "error"
      );
    });
  });

  /**
   * Teste 6: Deve mostrar e esconder indicador de carregamento
   */
  it("should show loading indicator during data fetch", async () => {
    // Configurar resposta atrasada da API
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => resolve(mockFiles);
    });

    getAllFiles.mockReturnValueOnce(apiPromise);

    // Renderizar componente - Não aguardamos a resolução ainda
    render(
      <FileProvider>
        <TestConsumer />
      </FileProvider>
    );

    // Verificar estado de carregamento
    expect(screen.getByTestId("loading-status")).toHaveTextContent("Loading");

    // Resolver a API call
    await act(async () => {
      resolveApiCall();
    });

    // Verificar que carregamento terminou
    expect(screen.getByTestId("loading-status")).toHaveTextContent("Idle");
  });
});
