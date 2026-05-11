import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/services/api";

/**
 * Hook para gerenciar a lógica de login
 * Centraliza toda a lógica de estado e ações relacionadas ao login
 */
export const useLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notify } = useNotification();

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      notify({ type: "success", message: "Login realizado com sucesso." });
      navigate("/");
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Falha no login. Verifique seu email e senha.",
      );
      setError(message);
      notify({ type: "error", message });
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para limpar os campos do formulário
  const clearForm = () => {
    setEmail("");
    setPassword("");
    setError("");
  };

  // Função para limpar apenas o erro
  const clearError = () => {
    setError("");
  };

  return {
    // Estado
    email,
    password,
    error,
    isLoading,

    // Setters
    setEmail,
    setPassword,

    // Ações
    handleSubmit,
    clearForm,
    clearError,
  };
};
