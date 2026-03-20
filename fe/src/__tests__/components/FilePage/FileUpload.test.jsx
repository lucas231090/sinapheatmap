import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FileUpload from "@/components/FilePage/FileUpload";
import { uploadHeatmap } from "@/services/fileService";
import userEvent from "@testing-library/user-event";

// Define mock functions at the top level
const mockFetchData = jest.fn();
const mockShowNotification = jest.fn();

// Mock useFileContext to return our mock functions
jest.mock("@/context/FileContext", () => ({
  useFileContext: () => ({
    fetchData: mockFetchData,
    showNotification: mockShowNotification,
  }),
}));

// Mock the config module to avoid the import.meta.env error
jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock file service
jest.mock("@/services/fileService", () => ({
  uploadHeatmap: jest.fn(),
}));

describe("FileUpload Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<FileUpload />);
  };

  test("renders upload form correctly", () => {
    renderComponent();

    // Check for text elements in the component
    expect(screen.getByText(/Upload Arquivo \.csv/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Arquivo de Imagem/i)).toBeInTheDocument();
    expect(screen.getByText(/Nome do Arquivo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar/i })).toBeInTheDocument();
  });

  test("enables form interaction when files are selected", async () => {
    // Add this line to mock URL.createObjectURL
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    const user = userEvent.setup();

    renderComponent();

    // Create mock files
    const csvFile = new File(["test csv content"], "test.csv", {
      type: "text/csv",
    });
    const imageFile = new File(["test image content"], "test.jpg", {
      type: "image/jpeg",
    });

    // Get file input elements using querySelector (hidden inputs are fine)
    const allInputs = document.querySelectorAll('input[type="file"]');
    const csvInput = Array.from(allInputs).find((input) =>
      input.accept.includes(".csv"),
    );
    const imageInput = Array.from(allInputs).find((input) =>
      input.accept.includes("image/*"),
    );

    expect(csvInput).toBeTruthy();
    expect(imageInput).toBeTruthy();

    await user.upload(csvInput, csvFile);
    await user.upload(imageInput, imageFile);

    // Check if file names are displayed
    await waitFor(() => {
      expect(screen.getByText("test.csv")).toBeInTheDocument();
      expect(screen.getByText("test.jpg")).toBeInTheDocument();
    });
  });

  test("submits form with selected files", async () => {
    // Mock successful upload
    uploadHeatmap.mockResolvedValueOnce({ success: true });

    // Set up URL.createObjectURL mock
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    const user = userEvent.setup();

    renderComponent();

    // Create mock files
    const csvFile = new File(["test csv content"], "test.csv", {
      type: "text/csv",
    });
    const imageFile = new File(["test image content"], "test.jpg", {
      type: "image/jpeg",
    });

    // Get file input elements using a more robust approach
    const allInputs = document.querySelectorAll('input[type="file"]');
    const csvInput = Array.from(allInputs).find((input) =>
      input.accept.includes(".csv"),
    );
    const imageInput = Array.from(allInputs).find((input) =>
      input.accept.includes("image/*"),
    );

    expect(csvInput).toBeTruthy();
    expect(imageInput).toBeTruthy();

    await user.upload(csvInput, csvFile);
    await user.upload(imageInput, imageFile);

    // Set a name for the file
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Test File Name" } });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /enviar/i });
    fireEvent.click(submitButton);

    // Verify uploadHeatmap was called with FormData
    await waitFor(() => {
      expect(uploadHeatmap).toHaveBeenCalledTimes(1);

      // Check FormData contents
      const formDataArg = uploadHeatmap.mock.calls[0][0];
      expect(formDataArg).toBeInstanceOf(FormData);
      expect(formDataArg.get("csvFile")).toEqual(csvFile);
      expect(formDataArg.get("mediaFile")).toEqual(imageFile);
      expect(formDataArg.get("filename")).toBe("Test File Name");
    });

    // Verify success notification was shown
    expect(mockShowNotification).toHaveBeenCalledWith(
      "Arquivo enviado com sucesso!",
      "success",
    );

    // Verify data was refreshed
    expect(mockFetchData).toHaveBeenCalled();
  });

  test("handles upload error", async () => {
    // Mock upload failure
    const error = new Error("Upload failed");
    uploadHeatmap.mockRejectedValueOnce(error);

    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    const user = userEvent.setup();

    renderComponent();

    // Create mock files
    const csvFile = new File(["test csv content"], "test.csv", {
      type: "text/csv",
    });
    const imageFile = new File(["test image content"], "test.jpg", {
      type: "image/jpeg",
    });

    // Get file input elements using a more robust approach
    const allInputs = document.querySelectorAll('input[type="file"]');
    const csvInput = Array.from(allInputs).find((input) =>
      input.accept.includes(".csv"),
    );
    const imageInput = Array.from(allInputs).find((input) =>
      input.accept.includes("image/*"),
    );

    expect(csvInput).toBeTruthy();
    expect(imageInput).toBeTruthy();

    await user.upload(csvInput, csvFile);
    await user.upload(imageInput, imageFile);

    // Set a name for the file
    const nameInput = screen.getByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Test File Name" } });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /enviar/i });
    fireEvent.click(submitButton);

    // Verify error notification was shown
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Upload failed",
        "error",
      );
    });

    // Verify data was not refreshed on error
    expect(mockFetchData).not.toHaveBeenCalled();
  });

  test("removes files when delete button is clicked", async () => {
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    const user = userEvent.setup();

    renderComponent();

    // Create mock files
    const csvFile = new File(["test csv content"], "test.csv", {
      type: "text/csv",
    });
    const imageFile = new File(["test image content"], "test.jpg", {
      type: "image/jpeg",
    });

    // Get file input elements using a more robust approach
    const allInputs = document.querySelectorAll('input[type="file"]');
    const csvInput = Array.from(allInputs).find((input) =>
      input.accept.includes(".csv"),
    );
    const imageInput = Array.from(allInputs).find((input) =>
      input.accept.includes("image/*"),
    );

    expect(csvInput).toBeTruthy();
    expect(imageInput).toBeTruthy();

    await user.upload(csvInput, csvFile);
    await user.upload(imageInput, imageFile);

    // Verify files were selected
    await waitFor(() => {
      expect(screen.getByText("test.csv")).toBeInTheDocument();
      expect(screen.getByText("test.jpg")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole("button", { name: "" }); // Delete button has no text
    fireEvent.click(deleteButton);

    // Verify files were removed
    await waitFor(() => {
      expect(screen.queryByText("test.csv")).not.toBeInTheDocument();
      expect(screen.queryByText("test.jpg")).not.toBeInTheDocument();
      expect(screen.getByText(/Upload Arquivo \.csv/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload Arquivo de Imagem/i)).toBeInTheDocument();
    });
  });
});
