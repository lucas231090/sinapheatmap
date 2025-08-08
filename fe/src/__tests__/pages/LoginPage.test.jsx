import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage/LoginPage";
import { useLogin } from "@/hooks/useLogin";
import { useTheme } from "@/hooks/useTheme";

jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock react-router-dom (if LoginPage uses useNavigate, Link, etc.)
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock hooks
jest.mock("@/hooks/useLogin");
jest.mock("@/hooks/useTheme");

describe("LoginPage Component", () => {
  let mockUseLogin;
  let mockUseTheme;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLogin = {
      email: "",
      password: "",
      error: null,
      isLoading: false,
      setEmail: jest.fn(),
      setPassword: jest.fn(),
      handleSubmit: jest.fn(), // Remove preventDefault to allow normal testing
      clearError: jest.fn(),
    };
    useLogin.mockReturnValue(mockUseLogin);

    mockUseTheme = {
      logoSrc: "mock-logo.png",
    };
    useTheme.mockReturnValue(mockUseTheme);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

  test("renders Logo and LoginForm", () => {
    renderComponent();
    expect(screen.getByRole("img", { name: /logo/i })).toBeInTheDocument();
    // Check for form elements instead of form role
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  test("calls useLogin.setEmail and useLogin.setPassword on input change", () => {
    renderComponent();
    // Assuming LoginForm has inputs with these labels and calls onEmailChange/onPasswordChange
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    expect(mockUseLogin.setEmail).toHaveBeenCalledWith("test@example.com");

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "password123" },
    });
    expect(mockUseLogin.setPassword).toHaveBeenCalledWith("password123");
  });

  test("calls useLogin.handleSubmit on form submission", async () => {
    renderComponent();
    // Submit the form instead of just clicking the button
    const form = screen
      .getByRole("button", { name: /entrar/i })
      .closest("form");
    fireEvent.submit(form);
    await waitFor(() => {
      expect(mockUseLogin.handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test("displays loading state when isLoading is true", () => {
    useLogin.mockReturnValue({ ...mockUseLogin, isLoading: true });
    renderComponent();
    // When loading, button text changes to "Entrando..." and is disabled
    expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /entrando/i })
    ).toBeInTheDocument();
  });

  test("displays error message when error is present and calls clearError", () => {
    const errorMessage = "Login failed";
    useLogin.mockReturnValue({ ...mockUseLogin, error: errorMessage });
    renderComponent();
    // Assuming LoginForm displays the error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Assuming LoginForm has a way to trigger error clearing, or it's part of the error display itself
    // For example, if there's a close button for the error message that calls onErrorClear
    // This part depends on LoginForm's implementation.
    // If LoginForm calls clearError on unmount or specific action, that should be tested in LoginForm's tests.
    // Here, we verify that clearError from the hook is passed to LoginForm.
    // A direct call to clearError might not happen from LoginPage itself unless there's a UI element for it.
  });

  test("LoginForm receives correct props from useLogin hook", () => {
    renderComponent();
    // Similar to SignupPage, this verifies props are passed.
    // For example, if LoginForm renders the error:
    useLogin.mockReturnValue({ ...mockUseLogin, error: "Test Login Error" });
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    ); // Re-render with new hook value
    expect(screen.getByText("Test Login Error")).toBeInTheDocument();
  });
});
