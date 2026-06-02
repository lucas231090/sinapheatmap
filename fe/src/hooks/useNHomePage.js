import { useCallback, useEffect, useMemo, useState, useReducer } from "react";

import { useNotifications } from "@/hooks/useNotifications";
import { getApiErrorMessage } from "@/services/api";
import { getExperiments } from "@/services/eyetrackingService";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateTimeFormatter.format(date);
}

function normalizeExperiment(record) {
  const jsonData = record?.jsonData || {};
  const isOldImported = Array.isArray(jsonData);
  const rawBasic = jsonData?.basic || {};

  const samples = isOldImported
    ? []
    : Array.isArray(jsonData.samples)
    ? jsonData.samples
    : [];
  const pieces = isOldImported
    ? []
    : Array.isArray(jsonData.pieces)
    ? jsonData.pieces
    : [];
  const normalizedParticipants = isOldImported
    ? []
    : Array.isArray(jsonData.participants)
    ? jsonData.participants
    : [];

  return {
    id: record?._id || record?.id || crypto.randomUUID(),
    name: record?.filename || rawBasic?.name || "Sem nome",
    description: record?.description || rawBasic?.description || "",
    active: Boolean(record?.active),
    isImported: Boolean(rawBasic?.isImported) || isOldImported,
    createdAt: formatDateTime(
      isOldImported
        ? record?.createdAt
        : jsonData?.createdAt || record?.createdAt,
    ),
    createdAtValue: isOldImported
      ? record?.createdAt || ""
      : jsonData?.createdAt || record?.createdAt || "",
    startDate: formatDateTime(rawBasic?.startDate || record?.startDate),
    endDate: formatDateTime(rawBasic?.endDate || record?.endDate),
    startDateValue: rawBasic?.startDate || record?.startDate || "",
    endDateValue: rawBasic?.endDate || record?.endDate || "",
    participantsCount: normalizedParticipants.length,
    samplesCount: isOldImported ? jsonData.length : samples.length,
    piecesCount: isOldImported ? 1 : pieces.length,
  };
}

export function useNHomePage() {
  const { notifyError } = useNotifications();
  const [loadState, dispatchLoad] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "START_LOAD":
          return { ...state, isLoading: true, error: "" };
        case "LOAD_SUCCESS":
          return { isLoading: false, error: "", experiments: action.payload };
        case "LOAD_FAILURE":
          return { isLoading: false, error: action.payload, experiments: [] };
        default:
          return state;
      }
    },
    { isLoading: true, error: "", experiments: [] },
  );

  const { isLoading, error, experiments } = loadState;

  const loadExperiments = useCallback(async () => {
    dispatchLoad({ type: "START_LOAD" });

    try {
      const response = await getExperiments();
      const normalizedList = Array.isArray(response)
        ? response.map(normalizeExperiment)
        : [];

      dispatchLoad({ type: "LOAD_SUCCESS", payload: normalizedList });
    } catch (loadError) {
      const message = getApiErrorMessage(
        loadError,
        "Não foi possível carregar os testes.",
      );
      dispatchLoad({ type: "LOAD_FAILURE", payload: message });
      notifyError(message);
    }
  }, [notifyError]);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const stats = useMemo(() => {
    return {
      total: experiments.length,
      active: experiments.filter((experiment) => experiment.active).length,
      inactive: experiments.filter((experiment) => !experiment.active).length,
    };
  }, [experiments]);

  return {
    experiments,
    isLoading,
    error,
    stats,
    refresh: loadExperiments,
  };
}
