import axios from "axios";
import config from "@/../config";

export const getApiErrorMessage = (
  error,
  fallbackMessage = "Ocorreu um erro. Tente novamente.",
) => {
  // axios network error: no response object
  if (!error?.response) {
    const isNetworkError =
      error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error" ||
      String(error?.message || "")
        .toLowerCase()
        .includes("network");

    if (isNetworkError) {
      return "Servidor indisponível. Verifique se o backend está no ar.";
    }

    return fallbackMessage;
  }

  const status = error.response.status;
  const data = error.response.data;

  const serverMessage =
    (typeof data === "string" && data) ||
    data?.error ||
    data?.message ||
    fallbackMessage;

  if (status === 409) {
    return "Este email já está em uso.";
  }

  if (status === 401) {
    return "Email ou senha inválidos.";
  }

  return serverMessage;
};

const getStoredAccessToken = () => {
  const directToken = localStorage.getItem("accessToken");

  if (directToken) {
    return directToken;
  }

  const authStorage = localStorage.getItem("n-auth-storage");

  if (!authStorage) {
    return "";
  }

  try {
    const parsed = JSON.parse(authStorage);
    return parsed?.state?.accessToken || "";
  } catch {
    return "";
  }
};

// Função para obter o cabeçalho de autorização
const getAuthHeader = () => {
  const token = getStoredAccessToken();
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
  },
);

// Adiciona um interceptor para tratar respostas e erros comuns
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento centralizado de erros
    if (error.response) {
      // Não redirecionar automaticamente em 401 para manter o erro na tela atual.
      // O caller decide como mostrar o problema ao usuário.
      if (error.response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("n-auth-storage");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
