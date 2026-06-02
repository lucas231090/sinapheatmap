import { useCallback, useEffect, useState, useReducer, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCreateExperimentWizard } from "@/hooks/useCreateExperimentWizard";
import { useNotifications } from "@/hooks/useNotifications";
import { getApiErrorMessage } from "@/services/api";
import {
  getExperimentById,
  updateExperiment,
} from "@/services/eyetrackingService";
import {
  buildExperimentPayload,
  buildParticipantsText,
  normalizeExperimentRecord,
} from "@/utils/eyetrackingExperimentWizard";

export function useEditExperimentWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifyError, notifySuccess } = useNotifications();
  const wizard = useCreateExperimentWizard();
  const {
    experiment,
    hydrateWizard,
    resetWizard,
    setIsSubmitting,
    setSubmissionError,
    validateBeforeSubmit,
  } = wizard;

  const [loadState, dispatchLoad] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "START_LOAD":
          return { isLoading: true, error: "" };
        case "LOAD_SUCCESS":
          return { isLoading: false, error: "" };
        case "LOAD_FAILURE":
          return { isLoading: false, error: action.payload };
        default:
          return state;
      }
    },
    { isLoading: true, error: "" },
  );

  const { isLoading, error: loadError } = loadState;
  const initialExperimentRef = useRef(null);
  const initialParticipantsTextRef = useRef("");
  const createdAtRef = useRef("");

  const loadExperiment = useCallback(async () => {
    if (!id) {
      dispatchLoad({ type: "LOAD_FAILURE", payload: "Id do experimento nao encontrado." });
      return;
    }

    dispatchLoad({ type: "START_LOAD" });

    try {
      const response = await getExperimentById(id);
      const normalized = normalizeExperimentRecord(response);
      const participantsText = buildParticipantsText(
        normalized.experiment.participants,
      );

      initialExperimentRef.current = normalized.experiment;
      initialParticipantsTextRef.current = participantsText;
      createdAtRef.current = normalized.createdAt;
      hydrateWizard(normalized.experiment, { participantsText });
      dispatchLoad({ type: "LOAD_SUCCESS" });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel carregar o experimento.",
      );
      dispatchLoad({ type: "LOAD_FAILURE", payload: message });
      notifyError(message);
    }
  }, [hydrateWizard, id, notifyError]);

  useEffect(() => {
    loadExperiment();
  }, [loadExperiment]);

  const resetToLoaded = useCallback(() => {
    if (!initialExperimentRef.current) {
      resetWizard();
      return;
    }

    hydrateWizard(initialExperimentRef.current, {
      participantsText: initialParticipantsTextRef.current,
    });
  }, [hydrateWizard, resetWizard]);

  const saveExperimentRequest = useCallback(async () => {
    if (!validateBeforeSubmit()) {
      return false;
    }

    if (!id) {
      const message = "Nao foi possivel identificar o experimento para edicao.";
      setSubmissionError(message);
      notifyError(message);
      return false;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const payload = buildExperimentPayload(experiment, {
        createdAt: createdAtRef.current,
      });
      const response = await updateExperiment(id, payload);
      const updatedExperiment = response?.data?.data || response?.data;
      const status = response?.status || (response?.status === 0 ? 0 : null);
      const isUpdated = Boolean(
        status === 200 || updatedExperiment?._id || updatedExperiment?.id,
      );

      if (!isUpdated) {
        throw new Error("Atualizacao nao confirmada pelo backend");
      }

      notifySuccess("Experimento atualizado com sucesso.");
      navigate("/home");
      return true;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel salvar o experimento.",
      );
      setSubmissionError(message);
      notifyError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    experiment,
    id,
    navigate,
    notifyError,
    notifySuccess,
    setIsSubmitting,
    setSubmissionError,
    validateBeforeSubmit,
  ]);

  return {
    ...wizard,
    isLoading,
    loadError,
    resetToLoaded,
    saveExperimentRequest,
  };
}
