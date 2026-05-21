import { useCallback, useEffect, useMemo, useState } from "react";

import { useNotifications } from "@/hooks/useNotifications";
import { getApiErrorMessage } from "@/services/api";
import { getExperiments } from "@/services/eyetrackingService";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExperiments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getExperiments();
      const normalizedList = Array.isArray(response)
        ? response.map(normalizeExperiment)
        : [];

      setExperiments(normalizedList);
    } catch (loadError) {
      const message = getApiErrorMessage(
        loadError,
        "Não foi possível carregar os testes.",
      );
      setError(message);
      notifyError(message);
      setExperiments([]);
    } finally {
      setIsLoading(false);
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
