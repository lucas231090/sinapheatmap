import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";

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

    // Função para lidar com o envio do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError("Falha no login. Verifique seu email e senha.");
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
        clearError
    };
};
