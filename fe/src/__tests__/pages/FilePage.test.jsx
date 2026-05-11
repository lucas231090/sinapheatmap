import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import FilePage from "@/pages/FilePage/FilePage";
import { useFilePage } from "@/hooks/useFilePage";

// Mock config
jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock the useFilePage hook
jest.mock("@/hooks/useFilePage");

// Mock components
jest.mock("@/components/FilePage/FileUpload", () => {
  return jest.fn(() => (
    <div data-testid="file-upload-mock">
      Mock File Upload Component
      <input type="file" data-testid="file-input" />
      <button data-testid="upload-button">Upload File</button>
    </div>
  ));
});

jest.mock("@/components/FilePage/FileList", () => {
  return jest.fn((props) => (
    <div data-testid="file-list-mock">
      Mock File List Component
      <div data-testid="file-item">
        Test File 1
        <button
          data-testid="delete-file-button"
          onClick={() => props.abrirModal("file-1")}
        >
          Delete
        </button>
      </div>
    </div>
  ));
});

jest.mock("@/components/General/CustomDialog", () => {
  return jest.fn((props) => (
    <div
      data-testid="custom-dialog-mock"
      style={{ display: props.isOpen ? "block" : "none" }}
      role="dialog"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title">{props.title}</h2>
      <p>{props.message}</p>
      <button data-testid="dialog-cancel" onClick={props.onClose}>
        Cancelar
      </button>
      <button data-testid="dialog-confirm" onClick={props.onConfirm}>
        Confirmar
      </button>
    </div>
  ));
});

jest.mock("@/components/General/Notification", () => {
  return jest.fn((props) => (
    <div
      data-testid="notification-mock"
      style={{ display: props.message ? "block" : "none" }}
      className={`notification ${props.type}`}
    >
      <span data-testid="notification-message">{props.message}</span>
      <button data-testid="notification-close" onClick={props.onClose}>
        ×
      </button>
    </div>
  ));
});

describe("FilePage Component", () => {
  let mockUseFilePage;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup(); // Clean up DOM before each test

    mockUseFilePage = {
      modalIsOpen: { open: false, id: "" },
      getFiles: [
        { id: "1", name: "test-file-1.csv", active: true },
        { id: "2", name: "test-file-2.csv", active: true },
      ],
      notification: { message: "", type: "" },
      abrirModal: jest.fn(),
      fecharModal: jest.fn(),
      showNotification: jest.fn(),
    };

    useFilePage.mockReturnValue(mockUseFilePage);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <FilePage />
      </BrowserRouter>
    );

  test("renders all main components", () => {
    renderComponent();

    expect(screen.getByTestId("file-upload-mock")).toBeInTheDocument();
    expect(screen.getByTestId("file-list-mock")).toBeInTheDocument();
    expect(screen.getByTestId("custom-dialog-mock")).toBeInTheDocument();
    expect(screen.getByTestId("notification-mock")).toBeInTheDocument();
  });

  test("renders layout with correct structure", () => {
    renderComponent();

    // Check main container
    const mainContainer = screen
      .getByTestId("file-upload-mock")
      .closest(".flex.flex-col.gap-4.p-8");
    expect(mainContainer).toBeInTheDocument();

    // Check layout for FileUpload and FileList
    const layoutContainer = screen
      .getByTestId("file-upload-mock")
      .closest(".flex.flex-row.gap-4.w-full.justify-center");
    expect(layoutContainer).toBeInTheDocument();
  });

  test("FileUpload and FileList components receive correct props", () => {
    renderComponent();

    const FileUploadMock = jest.requireMock("@/components/FilePage/FileUpload");
    const FileListMock = jest.requireMock("@/components/FilePage/FileList");

    // FileUpload should be called without specific props (it manages its own state)
    expect(FileUploadMock).toHaveBeenCalled();

    // FileList should receive getFiles and abrirModal props
    expect(FileListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        getFiles: mockUseFilePage.getFiles,
        abrirModal: mockUseFilePage.abrirModal,
      }),
      undefined
    );
  });

  test("CustomDialog receives correct props and is initially closed", () => {
    renderComponent();

    const CustomDialogMock = jest.requireMock(
      "@/components/General/CustomDialog"
    );

    expect(CustomDialogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: false,
        onClose: expect.any(Function),
        onConfirm: expect.any(Function),
        title: "Confirmação de Exclusão",
        message: "Você tem certeza de que deseja excluir este arquivo?",
      }),
      undefined
    );

    // Dialog should not be visible initially
    expect(screen.getByTestId("custom-dialog-mock")).toHaveStyle(
      "display: none"
    );
  });

  test("CustomDialog becomes visible when modal is open", () => {
    useFilePage.mockReturnValue({
      ...mockUseFilePage,
      modalIsOpen: { open: true, id: "file-1" },
    });

    renderComponent();

    expect(screen.getByTestId("custom-dialog-mock")).toHaveStyle(
      "display: block"
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("Notification component receives correct props", () => {
    renderComponent();

    const NotificationMock = jest.requireMock(
      "@/components/General/Notification"
    );

    expect(NotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: mockUseFilePage.notification.message,
        type: mockUseFilePage.notification.type,
        onClose: expect.any(Function),
      }),
      undefined
    );
  });

  test("displays notification when there is a message", () => {
    useFilePage.mockReturnValue({
      ...mockUseFilePage,
      notification: { message: "File uploaded successfully!", type: "success" },
    });

    renderComponent();

    const notification = screen.getByTestId("notification-mock");
    expect(notification).toHaveStyle("display: block");
    expect(screen.getByTestId("notification-message")).toHaveTextContent(
      "File uploaded successfully!"
    );
    expect(notification).toHaveClass("notification success");
  });

  test("hides notification when there is no message", () => {
    renderComponent();

    const notification = screen.getByTestId("notification-mock");
    expect(notification).toHaveStyle("display: none");
  });

  test("modal interaction - opening", () => {
    renderComponent();

    // Simulate clicking delete button in FileList
    fireEvent.click(screen.getByTestId("delete-file-button"));
    expect(mockUseFilePage.abrirModal).toHaveBeenCalledWith("file-1");
  });

  test("modal interaction - modal is visible when open", () => {
    // Set up mock with modal open
    useFilePage.mockReturnValue({
      ...mockUseFilePage,
      modalIsOpen: { open: true, id: "file-1" },
    });

    renderComponent();

    // Dialog should be visible
    expect(screen.getByTestId("custom-dialog-mock")).toHaveStyle(
      "display: block"
    );
  });

  test("modal interaction - closing", () => {
    // Set up mock with modal open
    useFilePage.mockReturnValue({
      ...mockUseFilePage,
      modalIsOpen: { open: true, id: "file-1" },
    });

    renderComponent();

    // Test cancel button
    fireEvent.click(screen.getByTestId("dialog-cancel"));
    expect(mockUseFilePage.fecharModal).toHaveBeenCalledWith(false);

    // Test confirm button
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    expect(mockUseFilePage.fecharModal).toHaveBeenCalledWith(true);
  });

  test("notification interaction - closing", () => {
    useFilePage.mockReturnValue({
      ...mockUseFilePage,
      notification: { message: "Test notification", type: "info" },
    });

    renderComponent();

    fireEvent.click(screen.getByTestId("notification-close"));
    expect(mockUseFilePage.showNotification).toHaveBeenCalledWith("", "");
  });

  test("handles error notification", () => {
    useFilePage.mockReturnValue({
      ...mockUseFilePage,
      notification: { message: "Error occurred", type: "error" },
    });

    renderComponent();

    const notification = screen.getByTestId("notification-mock");
    expect(notification).toHaveClass("notification error");
    expect(screen.getByTestId("notification-message")).toHaveTextContent(
      "Error occurred"
    );
  });

  test("useFilePage hook is called", () => {
    renderComponent();
    expect(useFilePage).toHaveBeenCalled();
  });

  test("layout responsive classes are applied", () => {
    renderComponent();

    // Check for responsive width classes using getAttribute or checking class lists
    const fileUploadContainer =
      screen.getByTestId("file-upload-mock").parentElement;
    const fileListContainer =
      screen.getByTestId("file-list-mock").parentElement;

    expect(fileUploadContainer).toHaveClass("w-1/2");
    expect(fileUploadContainer).toHaveClass("2xl:w-200");
    expect(fileListContainer).toHaveClass("w-1/2");
    expect(fileListContainer).toHaveClass("2xl:w-200");
  });

  test("handles multiple file operations", () => {
    renderComponent();

    // Test multiple modal operations
    fireEvent.click(screen.getByTestId("delete-file-button"));
    expect(mockUseFilePage.abrirModal).toHaveBeenCalledWith("file-1");

    // Clear previous calls
    mockUseFilePage.abrirModal.mockClear();

    // Simulate another file operation
    fireEvent.click(screen.getByTestId("delete-file-button"));
    expect(mockUseFilePage.abrirModal).toHaveBeenCalledWith("file-1");
  });

  test("components integration - FileList can trigger modal", () => {
    renderComponent();

    // Verify that FileList can trigger modal through abrirModal prop
    const FileListMock = jest.requireMock("@/components/FilePage/FileList");
    const lastCall =
      FileListMock.mock.calls[FileListMock.mock.calls.length - 1];
    const props = lastCall[0];

    // Call abrirModal prop directly
    props.abrirModal("test-file-id");
    expect(mockUseFilePage.abrirModal).toHaveBeenCalledWith("test-file-id");
  });

  test("notification callback function works correctly", () => {
    renderComponent();

    const NotificationMock = jest.requireMock(
      "@/components/General/Notification"
    );
    const lastCall =
      NotificationMock.mock.calls[NotificationMock.mock.calls.length - 1];
    const props = lastCall[0];

    // Call onClose prop directly
    props.onClose();
    expect(mockUseFilePage.showNotification).toHaveBeenCalledWith("", "");
  });

  test("dialog callback functions work correctly", () => {
    renderComponent();

    const CustomDialogMock = jest.requireMock(
      "@/components/General/CustomDialog"
    );
    const lastCall =
      CustomDialogMock.mock.calls[CustomDialogMock.mock.calls.length - 1];
    const props = lastCall[0];

    // Test onClose callback
    props.onClose();
    expect(mockUseFilePage.fecharModal).toHaveBeenCalledWith(false);

    // Test onConfirm callback
    props.onConfirm();
    expect(mockUseFilePage.fecharModal).toHaveBeenCalledWith(true);
  });
});
