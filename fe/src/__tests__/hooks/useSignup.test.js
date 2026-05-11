import { renderHook, act } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "@/hooks/useSignup";
import { registerUser } from "@/services/authService";
import { NotificationContext } from "@/context/NotificationContext";

// Mock das dependências
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("@/services/authService", () => ({
  registerUser: jest.fn(),
}));

describe("useSignup", () => {
  const mockNavigate = jest.fn();

  const wrapper = ({ children }) => (
    <NotificationContext.Provider
      value={{ notify: jest.fn(), clear: jest.fn() }}
    >
      {children}
    </NotificationContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("should initialize with empty form data", () => {
    const { result } = renderHook(() => useSignup(), { wrapper });

    expect(result.current.formData).toEqual({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    expect(result.current.error).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("should update form fields correctly", () => {
    const { result } = renderHook(() => useSignup(), { wrapper });

    act(() => {
      result.current.updateField("name", "João");
    });

    expect(result.current.formData.name).toBe("João");

    act(() => {
      result.current.updateField("email", "joao@test.com");
    });

    expect(result.current.formData.email).toBe("joao@test.com");
  });

  it("should show error when passwords do not match", async () => {
    const { result } = renderHook(() => useSignup(), { wrapper });

    // Configurar senhas diferentes
    act(() => {
      result.current.updateField("password", "senha123");
      result.current.updateField("confirmPassword", "senha456");
    });

    // Simular submit
    const mockEvent = { preventDefault: jest.fn() };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(result.current.error).toBe("As senhas não coincidem");
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("should register user successfully when passwords match", async () => {
    const { result } = renderHook(() => useSignup(), { wrapper });

    registerUser.mockResolvedValueOnce();

    // Configurar dados do formulário
    act(() => {
      result.current.updateField("name", "João");
      result.current.updateField("email", "joao@test.com");
      result.current.updateField("password", "senha123");
      result.current.updateField("confirmPassword", "senha123");
    });

    // Simular submit
    const mockEvent = { preventDefault: jest.fn() };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(registerUser).toHaveBeenCalledWith(
      "João",
      "joao@test.com",
      "senha123",
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: { message: "Cadastro realizado com sucesso! Faça o login." },
    });
    expect(result.current.error).toBe("");
  });

  it("should handle registration error", async () => {
    const { result } = renderHook(() => useSignup(), { wrapper });

    registerUser.mockRejectedValueOnce(new Error("Registration failed"));

    // Configurar dados do formulário
    act(() => {
      result.current.updateField("name", "João");
      result.current.updateField("email", "joao@test.com");
      result.current.updateField("password", "senha123");
      result.current.updateField("confirmPassword", "senha123");
    });

    // Simular submit
    const mockEvent = { preventDefault: jest.fn() };

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(result.current.error).toBe(
      "Erro ao registrar. Verifique seus dados e tente novamente.",
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should set loading state during registration", async () => {
    const { result } = renderHook(() => useSignup(), { wrapper });

    let resolveRegister;
    registerUser.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );

    // Configurar dados do formulário
    act(() => {
      result.current.updateField("name", "João");
      result.current.updateField("email", "joao@test.com");
      result.current.updateField("password", "senha123");
      result.current.updateField("confirmPassword", "senha123");
    });

    // Simular submit
    const mockEvent = { preventDefault: jest.fn() };

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    // Verificar que está loading
    expect(result.current.isLoading).toBe(true);

    // Resolver a promise
    await act(async () => {
      resolveRegister();
    });

    // Verificar que parou de fazer loading
    expect(result.current.isLoading).toBe(false);
  });
});
