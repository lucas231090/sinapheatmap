import api from "@/services/api";

const normalizeMediaName = (mediaName) => {
  if (!mediaName) {
    return "";
  }

  return String(mediaName).split(/[\\/]/).pop();
};

// Obter todos os arquivos de eyetracking
export const getAllFiles = async () => {
  try {
    const response = await api.get("/eyetracking");
    return response.data;
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error;
  }
};

// Obter um arquivo específico por ID
export const getFileById = async (id) => {
  try {
    const response = await api.get(`/eyetracking/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching file with id ${id}:`, error);
    throw error;
  }
};

// Criar um novo arquivo (upload de heatmap)
export const uploadHeatmap = async (formData) => {
  try {
    const response = await api.post("/heatmap", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading heatmap:", error);
    throw error;
  }
};

// Atualizar um arquivo existente
export const updateFile = async (id, fileData) => {
  try {
    const response = await api.put(`/heatmap/${id}`, fileData);
    return response.data;
  } catch (error) {
    console.error(`Error updating file with id ${id}:`, error);
    throw error;
  }
};

// Desativar (soft delete) um arquivo
export const deactivateFile = async (id) => {
  try {
    const response = await api.put(`/eyetracking/${id}`, { active: false });
    return response.data;
  } catch (error) {
    console.error(`Error deactivating file with id ${id}:`, error);
    throw error;
  }
};

// Obter dados da mídia para um arquivo específico
export const getFileMedia = async (mediaName) => {
  try {
    const normalizedName = normalizeMediaName(mediaName);

    if (!normalizedName) {
      throw new Error("Nome da mídia inválido");
    }

    const response = await api.get(
      `/uploads/media/${encodeURIComponent(normalizedName)}`,
      {
        responseType: "arraybuffer",
        timeout: 15000,
      },
    );

    const contentType =
      response.headers["content-type"] || "application/octet-stream";

    // Criar blob a partir do ArrayBuffer
    const blob = new Blob([response.data], { type: contentType });
    // eslint-disable-next-line react-doctor/no-create-object-url-without-revoke
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (error) {
    console.error("❌ Error fetching media file:", mediaName, error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });

    // Estratégia 3: Fallback final - URL absoluta do backend
    const baseUrl = api.defaults.baseURL || "";
    const fallbackUrl = `${baseUrl}/uploads/media/${encodeURIComponent(
      normalizeMediaName(mediaName),
    )}`;
    return fallbackUrl;
  }
};
