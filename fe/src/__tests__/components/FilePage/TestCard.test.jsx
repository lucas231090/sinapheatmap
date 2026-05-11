import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TestCard from "@/components/FilePage/TestCard/TestCard";
import { updateFile } from "@/services/fileService";

// Define mock functions at the top level
const mockNavigate = jest.fn();
const mockCallFunction = jest.fn();
const mockFetchData = jest.fn();
const mockShowNotification = jest.fn();

// Mock do módulo config.js
jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock do FileContext with access to the mock functions
jest.mock("@/context/FileContext", () => ({
  __esModule: true,
  FileContext: {
    Provider: ({ children }) => (
      <div data-testid="file-context-provider">{children}</div>
    ),
  },
  useFileContext: () => ({
    fetchData: mockFetchData,
    showNotification: mockShowNotification,
    files: [],
    loading: false,
  }),
}));

// Mock do serviço de arquivos
jest.mock("@/services/fileService", () => ({
  updateFile: jest.fn(),
}));

// Mock de react-router-dom navigate
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("TestCard Component", () => {
  const mockFile = {
    _id: "123",
    filename: "Test File",
    description: "Test Description",
    jsonData: [{ "Data-Hora": "2023-01-01" }],
  };

  const renderComponent = (file = mockFile) => {
    return render(
      <BrowserRouter>
        <TestCard file={file} callFunction={mockCallFunction} index={0} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Os testes continuam como antes, mas agora não dependem do FileContext real
  test("renders file information correctly", () => {
    renderComponent();
    expect(screen.getByText("Test File")).toBeInTheDocument();
    expect(screen.getByText(/Test Description/)).toBeInTheDocument();

    // Corrigir a verificação da data usando texto e formato corretos
    expect(screen.getByText(/Data de upload:/)).toBeInTheDocument();
    expect(
      screen.getByText("2023-01-01", { exact: false })
    ).toBeInTheDocument();
  });

  test("navigates to heatmap page when view button is clicked for mediaType 0", () => {
    // Use a file with mediaType 0 to show the "Ver Heatmap" button
    const fileWithImageType = { ...mockFile, mediaType: 0 };
    renderComponent(fileWithImageType);

    // Find and click view button
    const viewButton = screen.getByRole("button", { name: /Ver Heatmap/i });
    fireEvent.click(viewButton);

    // Should navigate to heatmap page with correct ID
    expect(mockNavigate).toHaveBeenCalledWith(`eyeheatmap/${mockFile._id}`);
  });

  test("navigates to video page when video button is clicked", () => {
    renderComponent();

    // Find and click video button - this button is always present
    const videoButton = screen.getByRole("button", { name: /Video/i });
    fireEvent.click(videoButton);

    // Should navigate to video page with correct ID
    expect(mockNavigate).toHaveBeenCalledWith(`heatmap-video/${mockFile._id}`);
  });

  test("shows edit form when edit button is clicked", () => {
    renderComponent();

    // Click the edit button using getByText
    const editButton = screen.getByText("Editar", { exact: false });
    fireEvent.click(editButton);

    // Check if we're in edit mode by looking for the labels
    expect(screen.getByText("Nome:")).toBeInTheDocument();
    expect(screen.getByText("Descrição:")).toBeInTheDocument();

    // Check if edit form has correct initial values by accessing the inputs by label text
    const nameInput = screen.getByLabelText("Nome:");
    const descriptionInput = screen.getByLabelText("Descrição:");
    expect(nameInput.value).toBe("Test File");
    expect(descriptionInput.value).toBe("Test Description");
  });

  test("cancels editing when cancel button is clicked", () => {
    renderComponent();

    // Enter edit mode
    const editButton = screen.getByText("Editar", { exact: false });
    fireEvent.click(editButton);

    // Change form values
    fireEvent.change(screen.getByLabelText("Nome:"), {
      target: { value: "Changed Name" },
    });
    fireEvent.change(screen.getByLabelText("Descrição:"), {
      target: { value: "Changed Description" },
    });

    // Click cancel button
    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);

    // Should exit edit mode and not call updateFile
    expect(screen.queryByLabelText("Nome:")).not.toBeInTheDocument();
    expect(updateFile).not.toHaveBeenCalled();

    // Original values should be displayed
    expect(screen.getByText("Test File")).toBeInTheDocument();
    expect(screen.getByText(/Test Description/)).toBeInTheDocument();
  });

  test("updates file when save button is clicked", async () => {
    updateFile.mockResolvedValueOnce({
      ...mockFile,
      filename: "Updated File",
      description: "Updated Description",
    });

    renderComponent();

    // Enter edit mode
    const editButton = screen.getByText("Editar", { exact: false });
    fireEvent.click(editButton);

    // Change form values
    fireEvent.change(screen.getByLabelText("Nome:"), {
      target: { value: "Updated File" },
    });
    fireEvent.change(screen.getByLabelText("Descrição:"), {
      target: { value: "Updated Description" },
    });

    // Click save button
    const saveButton = screen.getByText("Salvar");
    fireEvent.click(saveButton);

    // Should call updateFile with correct data
    expect(updateFile).toHaveBeenCalledWith("123", {
      filename: "Updated File",
      description: "Updated Description",
    });

    // Wait for update to complete
    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalledTimes(1);
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Arquivo atualizado com sucesso!",
        "success"
      );
    });

    // Should exit edit mode
    expect(screen.queryByLabelText("Nome:")).not.toBeInTheDocument();
  });

  test("handles update error gracefully", async () => {
    const error = new Error("Update failed");
    updateFile.mockRejectedValueOnce(error);

    renderComponent();

    // Enter edit mode
    const editButton = screen.getByText("Editar", { exact: false });
    fireEvent.click(editButton);

    // Change form values
    fireEvent.change(screen.getByLabelText("Nome:"), {
      target: { value: "Updated File" },
    });

    // Click save button
    const saveButton = screen.getByText("Salvar");
    fireEvent.click(saveButton);

    // Wait for error to be handled
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Update failed", // Changed to match actual error message
        "error"
      );
    });

    // Should remain in edit mode
    expect(screen.getByLabelText("Nome:")).toBeInTheDocument();
  });

  test("calls callFunction when delete button is clicked", () => {
    renderComponent();

    // Find and click delete button
    const deleteButton = screen.getByLabelText("Excluir");
    fireEvent.click(deleteButton);

    expect(mockCallFunction).toHaveBeenCalledWith("123");
  });

  test("handles file without description", () => {
    const fileWithoutDescription = {
      _id: "456",
      filename: "No Description File",
      jsonData: [{ "Data-Hora": "2023-02-01" }],
    };

    renderComponent(fileWithoutDescription);

    expect(screen.getByText("No Description File")).toBeInTheDocument();
    expect(screen.queryByText(/Test Description/)).not.toBeInTheDocument();
    // Fix the date format assertion to match what's actually in the DOM
    expect(screen.getByText(/Data de upload:/)).toBeInTheDocument();
    expect(
      screen.getByText("2023-02-01", { exact: false })
    ).toBeInTheDocument();
  });
});
