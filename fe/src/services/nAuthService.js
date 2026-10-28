import axios from "axios";
import config from "@/../config";

const authApi = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function readServerMessage(data) {
  if (!data) {
    return null;
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data) && data[0]?.message) {
    return data[0].message;
  }

  return data.error || data.message || null;
}

export function getAuthErrorMessage(
  error,
  fallbackMessage = "Nao foi possivel concluir a operacao.",
) {
  if (!error?.response) {
    return "Servidor indisponivel. Verifique sua conexao e tente novamente.";
  }

  const { status, data } = error.response;
  const serverMessage = readServerMessage(data);

  if (status === 400) {
    return serverMessage || "Dados invalidos. Revise os campos.";
  }

  if (status === 401) {
    return serverMessage || "Credenciais invalidas.";
  }

  if (status === 409) {
    return serverMessage || "Este email ja esta em uso.";
  }

  return serverMessage || fallbackMessage;
}

export async function signInRequest({ email, password }) {
  const response = await authApi.post("/sign-in", {
    email,
    password,
  });

  return response.data;
}

export async function signUpRequest({ name, email, password }) {
  const response = await authApi.post("/sign-up", {
    name,
    email,
    password,
  });

  return response.data;
}

export async function meRequest(accessToken) {
  const response = await authApi.get("/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}
