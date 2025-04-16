import api from "./api";

// Login do usuário
export const loginUser = async (email, password) => {
    try {
        const response = await api.post("/sign-in", {
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
        const response = await api.post("/sign-up", {
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
