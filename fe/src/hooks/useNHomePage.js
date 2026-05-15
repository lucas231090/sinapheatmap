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
  const samples = Array.isArray(jsonData.samples) ? jsonData.samples : [];
  const pieces = Array.isArray(jsonData.pieces) ? jsonData.pieces : [];

  return {
    id: record?._id || record?.id || crypto.randomUUID(),
    name: record?.filename || jsonData?.basic?.name || "Sem nome",
    description: record?.description || jsonData?.basic?.description || "",
    active: Boolean(record?.active),
    createdAt: formatDateTime(jsonData?.createdAt || record?.createdAt),
    samplesCount: samples.length,
    piecesCount: pieces.length,
  };
}

export function useNHomePage() {
  const { notifyError } = useNotifications();
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExperiments = useCallback(async () => {
    console.debug("useNHomePage: loadExperiments start");
    setIsLoading(true);
    setError("");

    try {
      const response = await getExperiments();
      console.debug("useNHomePage: getExperiments response:", response);
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
