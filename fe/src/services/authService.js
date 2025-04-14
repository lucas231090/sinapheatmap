import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Login do usuário
export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/sign-in`, {
            email,
            password,
        });
        if (response.data.accessToken) {
            localStorage.setItem("accessToken", response.data.accessToken);
            return response.data;
        }
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

// Registro de novo usuário
export const registerUser = async (name, email, password) => {
    try {
        const response = await axios.post(`${API_URL}/sign-up`, {
            name,
            email,
            password,
        });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

// Logout - remover token do localStorage
export const logout = () => {
    localStorage.removeItem("accessToken");
};

// Verificar se o usuário está autenticado
export const isAuthenticated = () => {
    const token = localStorage.getItem("accessToken");
    return !!token;
};

// Configurar o cabeçalho de autorização para requisições autenticadas
export const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        return { Authorization: `Bearer ${token}` };
    } else {
        return {};
    }
};