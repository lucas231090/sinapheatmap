import api from "@/services/api";

export const createExperiment = async (payload) => {
  const response = await api.post("/eyetracking", payload);
  return response; // return full axios response so callers can inspect status and data
};

export const uploadExperimentMedia = async (file) => {
  const formData = new FormData();
  formData.append("mediaFile", file);

  const response = await api.post("/eyetracking/media", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const importHeatmap = async (formData) => {
  const response = await api.post("/heatmap", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
};

export const updateImportedHeatmap = async (id, formData) => {
  const response = await api.put(`/heatmap/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
};

export const getExperiments = async () => {
  const response = await api.get("/eyetracking");
  return response.data;
};

export const getExperimentById = async (id) => {
  const response = await api.get(`/eyetracking/${id}`);
  return response.data;
};

export const getPublicExperimentById = async (id) => {
  const response = await api.get(`/eyetracking/public/${id}`);
  return response.data;
};

export const updateExperimentStatus = async (id, active) => {
  const response = await api.put(`/eyetracking/${id}`, { active });
  return response.data;
};

export const updateExperiment = async (id, payload) => {
  const response = await api.put(`/eyetracking/${id}`, payload);
  return response;
};

export const deleteExperiment = async (id) => {
  const response = await api.delete(`/eyetracking/${id}`);
  return response.data;
};

export const createEyeTrackingSession = async (payload) => {
  const response = await api.post("/eyetracking/sessions", payload);
  return response.data;
};

export const getExperimentSessions = async (id) => {
  const response = await api.get(`/eyetracking/${id}/sessions`);
  return response.data;
};
