import api from "@/services/api";

export const createExperiment = async (payload) => {
  console.debug("eyetrackingService: creating experiment", payload);
  const response = await api.post("/eyetracking", payload);
  console.debug("eyetrackingService: create response:", response);
  return response; // return full axios response so callers can inspect status and data
};

export const getExperiments = async () => {
  console.debug("eyetrackingService: requesting /eyetracking");
  const response = await api.get("/eyetracking");
  console.debug("eyetrackingService: /eyetracking response:", response);
  return response.data;
};

export const getExperimentById = async (id) => {
  const response = await api.get(`/eyetracking/${id}`);
  return response.data;
};

export const updateExperimentStatus = async (id, active) => {
  const response = await api.put(`/eyetracking/${id}`, { active });
  return response.data;
};
