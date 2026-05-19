import { useCallback, useEffect, useState } from "react";
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

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [initialExperiment, setInitialExperiment] = useState(null);
  const [initialParticipantsText, setInitialParticipantsText] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const loadExperiment = useCallback(async () => {
    if (!id) {
      setLoadError("Id do experimento nao encontrado.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const response = await getExperimentById(id);
      const normalized = normalizeExperimentRecord(response);
      const participantsText = buildParticipantsText(
        normalized.experiment.participants,
      );

      setInitialExperiment(normalized.experiment);
      setInitialParticipantsText(participantsText);
      setCreatedAt(normalized.createdAt);
      hydrateWizard(normalized.experiment, { participantsText });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Nao foi possivel carregar o experimento.",
      );
      setLoadError(message);
      notifyError(message);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateWizard, id, notifyError]);

  useEffect(() => {
    loadExperiment();
  }, [loadExperiment]);

  const resetToLoaded = useCallback(() => {
    if (!initialExperiment) {
      resetWizard();
      return;
    }

    hydrateWizard(initialExperiment, {
      participantsText: initialParticipantsText,
    });
  }, [hydrateWizard, initialExperiment, initialParticipantsText, resetWizard]);

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
      const payload = buildExperimentPayload(experiment, { createdAt });
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
    createdAt,
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
