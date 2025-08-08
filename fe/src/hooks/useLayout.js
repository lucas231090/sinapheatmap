import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";

/**
 * Hook otimizado para gerenciar a lógica do layout principal
 * Inclui gerenciamento de tema escuro e autenticação
 */
const useLayout = () => {
    const [darkMode, setDarkMode] = useState(() =>
        document.documentElement.classList.contains("dark")
    );
    const { isLoggedIn, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Toggle do modo escuro - memoizado para evitar re-criações
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => !prev);
    }, []);

    // Efeito para aplicar o tema escuro no documento
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    // Handler para logout - memoizado para evitar re-criações
    const handleLogout = useCallback(() => {
        logout();
        navigate("/login");
    }, [logout, navigate]);

    return {
        darkMode,
        toggleDarkMode,
        isLoggedIn,
        handleLogout,
    };
};

export default useLayout;
