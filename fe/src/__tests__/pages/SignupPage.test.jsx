import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignupPage from "@/pages/SignupPage/SignupPage";
import { useSignup } from "@/hooks/useSignup";
import { useTheme } from "@/hooks/useTheme";

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock hooks
jest.mock("@/hooks/useSignup");
jest.mock("@/hooks/useTheme");

describe("SignupPage Component", () => {
  let mockUseSignup;
  let mockUseTheme;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSignup = {
      formData: { name: "", email: "", password: "", confirmPassword: "" },
      error: null,
      isLoading: false,
      updateField: jest.fn(),
      handleSubmit: jest.fn(),
    };
    useSignup.mockReturnValue(mockUseSignup);

    mockUseTheme = {
      logoSrc: "mock-logo.png",
    };
    useTheme.mockReturnValue(mockUseTheme);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

  test("renders Logo and SignupForm", () => {
    renderComponent();
    expect(screen.getByRole("img", { name: /logo/i })).toBeInTheDocument();
    // Check for form elements instead of form role
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registrar/i })
    ).toBeInTheDocument();
  });

  test("calls useSignup.updateField on input change", () => {
    renderComponent();
    // Based on the error, updateField receives field name and value separately
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { name: "name", value: "Test User" },
    });
    expect(mockUseSignup.updateField).toHaveBeenCalledWith("name", "Test User");

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "test@example.com" },
    });
    expect(mockUseSignup.updateField).toHaveBeenCalledWith(
      "email",
      "test@example.com"
    );
  });

  test("calls useSignup.handleSubmit on form submission", async () => {
    renderComponent();
    // Submit the form instead of just clicking the button
    const form = screen
      .getByRole("button", { name: /registrar/i })
      .closest("form");
    fireEvent.submit(form);
    await waitFor(() => {
      expect(mockUseSignup.handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test("displays loading state when isLoading is true", () => {
    useSignup.mockReturnValue({ ...mockUseSignup, isLoading: true });
    renderComponent();
    // When loading, button text changes to "Registrando..." and is disabled
    expect(screen.getByRole("button", { name: /registrando/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /registrando/i })
    ).toBeInTheDocument();
  });

  test("displays error message when error is present", () => {
    const errorMessage = "Registration failed";
    useSignup.mockReturnValue({ ...mockUseSignup, error: errorMessage });
    renderComponent();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test("SignupForm receives correct props", () => {
    renderComponent();
    useSignup.mockReturnValue({ ...mockUseSignup, error: "Test Error" });
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    ); // Re-render with new hook value
    expect(screen.getByText("Test Error")).toBeInTheDocument();
  });
});
