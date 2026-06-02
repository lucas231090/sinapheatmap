import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "@/hooks/useNotifications";
import { getApiErrorMessage } from "@/services/api";
import {
  createExperiment,
  uploadExperimentMedia,
} from "@/services/eyetrackingService";
import {
  buildExperimentPayload,
  buildParticipantsText,
  canAdvanceFromAssets,
  createEmptyExperimentState,
  createEmptyParticipant,
  createEmptyPieceDraft,
  createEmptySampleDraft,
  isVideoSource,
  moveItem,
  parseParticipantRows,
  reorderPiecesWithinSample,
  hasInvalidParticipantCpf,
} from "@/utils/eyetrackingExperimentWizard";

export function useCreateExperimentWizard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();

  const [activeStep, setActiveStep] = useState(1);
  const [experiment, setExperiment] = useState(() =>
    createEmptyExperimentState(),
  );
  const [sampleDraft, setSampleDraft] = useState(() =>
    createEmptySampleDraft(),
  );
  const [pieceDraft, setPieceDraft] = useState(() => createEmptyPieceDraft());
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [organizationSampleId, setOrganizationSampleId] = useState(null);
  const [participantsText, setParticipantsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const selectedOrganizationPieces = useMemo(() => {
    if (!organizationSampleId) {
      return [];
    }

    return experiment.pieces.filter(
      (piece) => piece.sampleId === organizationSampleId,
    );
  }, [experiment.pieces, organizationSampleId]);

  const selectedSample = useMemo(
    () =>
      experiment.samples.find((sample) => sample.id === selectedSampleId) ||
      null,
    [experiment.samples, selectedSampleId],
  );

  const selectedPiece = useMemo(
    () =>
      experiment.pieces.find((piece) => piece.id === selectedPieceId) || null,
    [experiment.pieces, selectedPieceId],
  );

  const resetWizard = useCallback(() => {
    const initialState = createEmptyExperimentState();
    setExperiment(initialState);
    setSampleDraft(createEmptySampleDraft());
    setPieceDraft(createEmptyPieceDraft());
    setSelectedSampleId(null);
    setSelectedPieceId(null);
    setOrganizationSampleId(null);
    setParticipantsText("");
    setActiveStep(1);
    setSubmissionError("");
    setIsSubmitting(false);
    notifyInfo("Formulário reiniciado.");
  }, [notifyInfo]);

  const updateBasicField = useCallback((field, value) => {
    setExperiment((current) => ({
      ...current,
      basic: {
        ...current.basic,
        [field]: value,
      },
    }));
  }, []);

  const updateIdentificationField = useCallback((field, value) => {
    setExperiment((current) => ({
      ...current,
      identification: {
        ...current.identification,
        [field]: value,
      },
    }));
  }, []);

  const updateOrganizationField = useCallback((field, value) => {
    setExperiment((current) => ({
      ...current,
      organization: {
        ...current.organization,
        [field]: value,
      },
    }));
  }, []);

  const updateParticipantField = useCallback((participantId, field, value) => {
    setExperiment((current) => ({
      ...current,
      participants: current.participants.map((participant) =>
        participant.id === participantId
          ? { ...participant, [field]: value }
          : participant,
      ),
    }));
  }, []);

  const addParticipantRow = useCallback(() => {
    setExperiment((current) => ({
      ...current,
      participants: [...current.participants, createEmptyParticipant()],
    }));
  }, []);

  const removeParticipantRow = useCallback((participantId) => {
    setExperiment((current) => {
      const nextParticipants = current.participants.filter(
        (participant) => participant.id !== participantId,
      );

      return {
        ...current,
        participants: nextParticipants.length
          ? nextParticipants
          : [createEmptyParticipant()],
      };
    });
  }, []);

  const updateSampleDraft = useCallback((field, value) => {
    setSampleDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const clearSampleDraft = useCallback(() => {
    setSampleDraft(createEmptySampleDraft());
    setSelectedSampleId(null);
  }, []);

  const selectSampleForEdit = useCallback(
    (sampleId) => {
      const sample = experiment.samples.find((item) => item.id === sampleId);

      if (!sample) {
        return;
      }

      setSelectedSampleId(sampleId);
      setSampleDraft({ ...sample });
    },
    [experiment.samples],
  );

  const saveSampleDraft = useCallback(
    (shouldCreateNew = false) => {
      if (!sampleDraft.name.trim()) {
        notifyError("Informe o nome da amostra.");
        return null;
      }

      const sampleId =
        selectedSampleId || sampleDraft.id || crypto.randomUUID();
      const normalizedSample = {
        id: sampleId,
        name: sampleDraft.name.trim(),
        description: sampleDraft.description.trim(),
      };

      setExperiment((current) => {
        const exists = current.samples.some((sample) => sample.id === sampleId);

        return {
          ...current,
          samples: exists
            ? current.samples.map((sample) =>
                sample.id === sampleId ? normalizedSample : sample,
              )
            : [...current.samples, normalizedSample],
        };
      });

      if (!organizationSampleId) {
        setOrganizationSampleId(sampleId);
      }

      if (shouldCreateNew) {
        setSelectedSampleId(null);
        setSampleDraft(createEmptySampleDraft());
      } else {
        setSelectedSampleId(sampleId);
        setSampleDraft(normalizedSample);
      }

      return sampleId;
    },
    [notifyError, organizationSampleId, sampleDraft, selectedSampleId],
  );

  const deleteSample = useCallback(
    (sampleId) => {
      setExperiment((current) => {
        const nextSamples = current.samples.filter(
          (sample) => sample.id !== sampleId,
        );
        const nextPieces = current.pieces.filter(
          (piece) => piece.sampleId !== sampleId,
        );
        return {
          ...current,
          samples: nextSamples,
          pieces: nextPieces,
        };
      });

      setSelectedSampleId((currentSelected) =>
        currentSelected === sampleId ? null : currentSelected,
      );
      setOrganizationSampleId((currentOrganization) =>
        currentOrganization === sampleId ? null : currentOrganization,
      );
      setPieceDraft((currentDraft) =>
        currentDraft.sampleId === sampleId
          ? createEmptyPieceDraft("")
          : currentDraft,
      );

      if (selectedSampleId === sampleId) {
        setSampleDraft(createEmptySampleDraft());
      }

      if (selectedPiece && selectedPiece.sampleId === sampleId) {
        setPieceDraft(createEmptyPieceDraft());
        setSelectedPieceId(null);
      }
    },
    [selectedPiece, selectedSampleId],
  );

  const updatePieceDraft = useCallback((field, value) => {
    setPieceDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handlePieceFileSelected = useCallback(
    (event) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      const localPreviewUrl = URL.createObjectURL(selectedFile);

      (async () => {
        try {
          const uploadedMedia = await uploadExperimentMedia(selectedFile);
          const uploadedUrl =
            uploadedMedia?.data?.mediaUrl || uploadedMedia?.mediaUrl || "";
          const uploadedPath =
            uploadedMedia?.data?.mediaPath || uploadedMedia?.mediaPath || "";

          setPieceDraft((current) => ({
            ...current,
            sourceType: "file",
            sourceLabel: selectedFile.name,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            previewUrl: localPreviewUrl,
            sourceUrl: uploadedUrl,
            mediaPath: uploadedPath,
            previewKind: selectedFile.type.startsWith("video/")
              ? "video"
              : "image",
          }));
        } catch (error) {
          URL.revokeObjectURL(localPreviewUrl);
          notifyError(
            getApiErrorMessage(
              error,
              "Nao foi possivel enviar a midia selecionada.",
            ),
          );
        }
      })();

      event.target.value = "";
    },
    [notifyError],
  );

  const clearPieceDraft = useCallback(() => {
    setPieceDraft(createEmptyPieceDraft(selectedSampleId || ""));
    setSelectedPieceId(null);
  }, [selectedSampleId]);

  const selectPieceForEdit = useCallback(
    (pieceId) => {
      const piece = experiment.pieces.find((item) => item.id === pieceId);

      if (!piece) {
        return;
      }

      setSelectedPieceId(pieceId);
      setPieceDraft({ ...piece });
      if (piece.sampleId) {
        setOrganizationSampleId(piece.sampleId);
      }
    },
    [experiment.pieces],
  );

  const savePieceDraft = useCallback(
    (shouldCreateNew = false) => {
      const resolvedSampleId = (pieceDraft.sampleId && experiment.samples.some((s) => s.id === pieceDraft.sampleId))
        ? pieceDraft.sampleId
        : (experiment.samples[0]?.id || "");

      if (!resolvedSampleId) {
        notifyError("Selecione uma amostra para vincular a peça.");
        return null;
      }

      const sourceLabel =
        pieceDraft.sourceType === "url"
          ? pieceDraft.sourceUrl.trim()
          : pieceDraft.sourceLabel.trim();

      if (!sourceLabel) {
        notifyError("Selecione uma imagem/vídeo ou informe uma URL.");
        return null;
      }

      if (pieceDraft.sourceType === "file" && !pieceDraft.sourceUrl.trim()) {
        notifyError("A mídia do arquivo ainda nao foi enviada.");
        return null;
      }

      const pieceId = selectedPieceId || pieceDraft.id || crypto.randomUUID();
      const normalizedPiece = {
        id: pieceId,
        sampleId: resolvedSampleId,
        sourceType: pieceDraft.sourceType,
        sourceLabel,
        sourceUrl: pieceDraft.sourceUrl.trim(),
        fileName: pieceDraft.fileName || "",
        mimeType: pieceDraft.mimeType || "",
        previewUrl:
          pieceDraft.previewUrl &&
          !pieceDraft.previewUrl.startsWith("data:") &&
          !pieceDraft.previewUrl.startsWith("blob:")
            ? pieceDraft.previewUrl
            : "",
        mediaPath: pieceDraft.mediaPath || "",
        exposureSeconds: String(pieceDraft.exposureSeconds || "10").trim(),
        previewKind: isVideoSource(pieceDraft) ? "video" : "image",
        imageDisplayMode: pieceDraft.imageDisplayMode || "original",
      };

      setExperiment((current) => {
        const exists = current.pieces.some((piece) => piece.id === pieceId);

        return {
          ...current,
          pieces: exists
            ? current.pieces.map((piece) =>
                piece.id === pieceId ? normalizedPiece : piece,
              )
            : [...current.pieces, normalizedPiece],
        };
      });

      setSelectedPieceId(pieceId);

      if (shouldCreateNew) {
        setSelectedPieceId(null);
        setPieceDraft(createEmptyPieceDraft(resolvedSampleId));
      } else {
        setPieceDraft(normalizedPiece);
      }

      return pieceId;
    },
    [experiment.samples, notifyError, pieceDraft, selectedPieceId],
  );

  const deletePiece = useCallback(
    (pieceId) => {
      setExperiment((current) => {
        const nextPieces = current.pieces.filter(
          (piece) => piece.id !== pieceId,
        );
        return {
          ...current,
          pieces: nextPieces,
        };
      });

      setSelectedPieceId((currentSelected) =>
        currentSelected === pieceId ? null : currentSelected,
      );

      if (selectedPieceId === pieceId) {
        setPieceDraft(createEmptyPieceDraft(pieceDraft.sampleId));
      }
    },
    [pieceDraft.sampleId, selectedPieceId],
  );

  const moveSample = useCallback((sampleId, direction) => {
    setExperiment((current) => {
      const currentIndex = current.samples.findIndex(
        (sample) => sample.id === sampleId,
      );
      const nextIndex = currentIndex + direction;

      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= current.samples.length
      ) {
        return current;
      }

      return {
        ...current,
        samples: moveItem(current.samples, currentIndex, nextIndex),
      };
    });
  }, []);

  const movePiece = useCallback(
    (pieceId, direction) => {
      setExperiment((current) => {
        const currentPieces = current.pieces.filter(
          (piece) => piece.sampleId === organizationSampleId,
        );
        const currentIndex = currentPieces.findIndex(
          (piece) => piece.id === pieceId,
        );
        const nextIndex = currentIndex + direction;

        if (
          currentIndex < 0 ||
          nextIndex < 0 ||
          nextIndex >= currentPieces.length
        ) {
          return current;
        }

        return {
          ...current,
          pieces: reorderPiecesWithinSample(
            current.pieces,
            organizationSampleId,
            currentIndex,
            nextIndex,
          ),
        };
      });
    },
    [organizationSampleId],
  );

  const canContinueToOrganization = useMemo(
    () => canAdvanceFromAssets(experiment.samples, experiment.pieces),
    [experiment.pieces, experiment.samples],
  );

  const validateBeforeSubmit = useCallback(() => {
    if (!experiment.basic.name.trim()) {
      notifyError("O nome do experimento é obrigatório.");
      setSubmissionError("O nome do experimento é obrigatório.");
      setActiveStep(1);
      return false;
    }

    if (hasInvalidParticipantCpf(experiment.participants)) {
      notifyError("Existe um CPF inválido na lista de participantes.");
      setSubmissionError("Existe um CPF inválido na lista de participantes.");
      setActiveStep(2);
      return false;
    }

    if (!canContinueToOrganization) {
      notifyError("Cada amostra precisa ter pelo menos uma peça.");
      setSubmissionError("Cada amostra precisa ter pelo menos uma peça.");
      setActiveStep(3);
      return false;
    }

    setSubmissionError("");
    return true;
  }, [
    canContinueToOrganization,
    experiment.basic.name,
    experiment.participants,
    notifyError,
    setActiveStep,
    setSubmissionError,
  ]);

  const goToNextStep = useCallback(() => {
    if (activeStep === 1 && !experiment.basic.name.trim()) {
      notifyError("O nome do experimento é obrigatório.");
      setSubmissionError("O nome do experimento é obrigatório.");
      return false;
    }

    if (activeStep === 3 && !canContinueToOrganization) {
      setSubmissionError("Cada amostra precisa ter pelo menos uma peça.");
      notifyError("Cada amostra precisa ter pelo menos uma peça.");
      return false;
    }

    setSubmissionError("");
    setActiveStep((current) => Math.min(current + 1, 4));
    return true;
  }, [
    activeStep,
    canContinueToOrganization,
    experiment.basic.name,
    notifyError,
  ]);

  const goToPreviousStep = useCallback(() => {
    setSubmissionError("");
    setActiveStep((current) => Math.max(current - 1, 1));
  }, []);

  const createExperimentRequest = useCallback(async () => {
    if (!validateBeforeSubmit()) {
      return false;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      console.debug("useCreateExperimentWizard: creating experiment payload");
      const payload = buildExperimentPayload(experiment);
      const response = await createExperiment(payload);
      console.debug("useCreateExperimentWizard: create response:", response);

      // Support both shapes: axios response where data may contain { message, data }
      // or service previously returning response.data directly.
      const createdExperiment = response?.data?.data || response?.data;
      const status = response?.status || (response?.status === 0 ? 0 : null);

      const isCreated = Boolean(
        status === 201 || (createdExperiment && createdExperiment._id),
      );

      if (!isCreated) {
        const err = new Error("Criação não confirmada pelo backend");
        err.response = response;
        throw err;
      }

      notifySuccess("Experimento criado com sucesso.");
      navigate("/home");
      return true;
    } catch (error) {
      console.error("createExperimentRequest error:", error);
      const message =
        error?.response?.status === 401
          ? "Não foi possível criar o experimento. Verifique os dados ou tente novamente."
          : getApiErrorMessage(error, "Não foi possível criar o experimento.");
      setSubmissionError(message);
      notifyError(message);
      // Do NOT navigate away on error; keep user on the wizard so they can fix.
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [experiment, navigate, notifyError, notifySuccess, validateBeforeSubmit]);

  const importParticipants = useCallback(() => {
    const parsedRows = parseParticipantRows(participantsText);

    if (!parsedRows.length) {
      notifyError("Cole uma lista válida no formato Nome, CPF.");
      return;
    }

    if (hasInvalidParticipantCpf(parsedRows)) {
      notifyError("Um ou mais CPFs importados são inválidos.");
      return;
    }

    setExperiment((current) => ({
      ...current,
      participants: parsedRows,
    }));
    notifySuccess(`${parsedRows.length} participante(s) importado(s).`);
  }, [notifyError, notifySuccess, participantsText]);

  const hydrateWizard = useCallback(
    (nextExperiment, options = {}) => {
      if (!nextExperiment) {
        return;
      }

      setExperiment(nextExperiment);

      const nextParticipantsText =
        options.participantsText ??
        buildParticipantsText(nextExperiment.participants);

      const defaultSampleId = nextExperiment.samples[0]?.id || null;
      const defaultPieceId = nextExperiment.pieces[0]?.id || null;
      const selectedSampleId = options.selectedSampleId ?? defaultSampleId;
      const selectedPieceId = options.selectedPieceId ?? defaultPieceId;

      const selectedSample = nextExperiment.samples.find(
        (sample) => sample.id === selectedSampleId,
      );
      const selectedPiece = nextExperiment.pieces.find(
        (piece) => piece.id === selectedPieceId,
      );

      const organizationSampleId =
        options.organizationSampleId ??
        nextExperiment.organization?.sampleOrder?.[0] ??
        selectedSampleId;

      setParticipantsText(nextParticipantsText);
      setSelectedSampleId(selectedSampleId);
      setSelectedPieceId(selectedPieceId);
      setOrganizationSampleId(organizationSampleId || null);
      setSampleDraft(
        selectedSample ? { ...selectedSample } : createEmptySampleDraft(),
      );
      setPieceDraft(
        selectedPiece
          ? { ...selectedPiece }
          : createEmptyPieceDraft(selectedSampleId || ""),
      );
      setActiveStep(options.activeStep ?? 1);
      setSubmissionError("");
      setIsSubmitting(false);
    },
    [
      setActiveStep,
      setExperiment,
      setIsSubmitting,
      setOrganizationSampleId,
      setParticipantsText,
      setPieceDraft,
      setSampleDraft,
      setSelectedPieceId,
      setSelectedSampleId,
      setSubmissionError,
    ],
  );

  return {
    activeStep,
    experiment,
    fileInputRef,
    selectedSample,
    selectedPiece,
    selectedSampleId,
    selectedPieceId,
    organizationSampleId,
    selectedOrganizationPieces,
    sampleDraft,
    pieceDraft,
    participantsText,
    isSubmitting,
    submissionError,
    canContinueToOrganization,
    setActiveStep,
    setParticipantsText,
    setSampleDraft,
    setPieceDraft,
    setSelectedSampleId,
    setSelectedPieceId,
    setOrganizationSampleId,
    setIsSubmitting,
    setSubmissionError,
    updateBasicField,
    updateIdentificationField,
    updateOrganizationField,
    updateParticipantField,
    addParticipantRow,
    removeParticipantRow,
    importParticipants,
    updateSampleDraft,
    clearSampleDraft,
    selectSampleForEdit,
    saveSampleDraft,
    deleteSample,
    updatePieceDraft,
    handlePieceFileSelected,
    clearPieceDraft,
    selectPieceForEdit,
    savePieceDraft,
    deletePiece,
    moveSample,
    movePiece,
    resetWizard,
    goToNextStep,
    goToPreviousStep,
    validateBeforeSubmit,
    createExperimentRequest,
    hydrateWizard,
  };
}
