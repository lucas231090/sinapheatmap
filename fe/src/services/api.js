import axios from "axios";
import config from "../../config";

// Função para obter o cabeçalho de autorização
const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Cria uma instância do axios com configurações base
const api = axios.create({
    baseURL: config.API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Adiciona um interceptor para incluir o token de autenticação em todas as requisições
api.interceptors.request.use(
    (config) => {
        const authHeader = getAuthHeader();
        if (authHeader.Authorization) {
            config.headers.Authorization = authHeader.Authorization;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Adiciona um interceptor para tratar respostas e erros comuns
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Tratamento centralizado de erros
        if (error.response) {
            // O servidor respondeu com um status de erro
            if (error.response.status === 401) {
                // Token expirado ou inválido - faça logout
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;