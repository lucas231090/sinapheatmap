import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";

import { useNotifications } from "@/hooks/useNotifications";
import { getApiErrorMessage, getPublicMediaUrl } from "@/services/api";
import {
  updateImportedHeatmap,
  updateExperiment,
  uploadExperimentMedia,
} from "@/services/eyetrackingService";
import { fileToDataUrl } from "@/utils/importExperiment";
import { buildExperimentPayload } from "@/utils/eyetrackingExperimentWizard";

export default function NEditImported({ experiment, onCancel }) {
  const navigate = useNavigate();
  const { notifyError, notifySuccess } = useNotifications();

  const [name, setName] = useState(experiment.basic.name || "");
  const [description, setDescription] = useState(
    experiment.basic.description || "",
  );
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const originalMediaUrl = useMemo(() => {
    // If it has old media format, it was normalized
    if (experiment.pieces && experiment.pieces.length > 0) {
      return experiment.pieces[0].mediaUrl
        ? getPublicMediaUrl(experiment.pieces[0].mediaUrl)
        : "";
    }
    return "";
  }, [experiment]);

  const mediaKind = useMemo(() => {
    if (!mediaFile) {
      return experiment.pieces?.[0]?.previewKind || "image";
    }
    return mediaFile.type.startsWith("video/") ? "video" : "image";
  }, [mediaFile, experiment]);

  const handleMediaChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setMediaFile(selectedFile);
    setErrorMessage("");

    if (!selectedFile) {
      setMediaPreview("");
      return;
    }

    try {
      const previewUrl = await fileToDataUrl(selectedFile);
      setMediaPreview(previewUrl);
    } catch (mediaError) {
      console.error("Edit imported page media read error:", mediaError);
      setMediaPreview("");
      setErrorMessage("Não foi possível preparar a pré-visualização da mídia.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Informe o nome do experimento.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("filename", name.trim());
      formData.append("description", description.trim());
      if (mediaFile) {
        formData.append("mediaFile", mediaFile);
      }

      // Resolve record id from multiple possible locations to be robust
      const recordId =
        experiment?.basic?.recordId ||
        experiment?.recordId ||
        experiment?._id ||
        experiment?.id;

      if (!recordId) {
        const err = new Error("ID do experimento não encontrado");
        err.code = "MISSING_ID";
        throw err;
      }

      console.debug("NEditImported: preparing to update experiment", {
        recordId,
        name: name.trim(),
        description: description.trim(),
        hasMediaFile: Boolean(mediaFile),
      });

      // log FormData keys for diagnosis (can't log values directly reliably)
      try {
        const keys = [];
        for (const pair of formData.entries()) {
          keys.push(pair[0]);
        }
        console.debug("NEditImported: formData keys", keys);
      } catch (err) {
        console.debug("NEditImported: could not enumerate formData keys", err);
      }

      const response = await updateImportedHeatmap(recordId, formData);
      console.debug("NEditImported: updateImportedHeatmap response", response);

      // Backend may return axios response object or data directly
      const status =
        response?.status || (response?.data && response.data.status) || null;
      const updatedExperiment =
        response?.data?.data || response?.data || response;

      const isUpdated = Boolean(
        status === 200 ||
          status === 204 ||
          updatedExperiment?._id ||
          updatedExperiment?.id,
      );

      if (!isUpdated) {
        console.debug("NEditImported: update not confirmed", {
          status,
          updatedExperiment,
        });
        const message = getApiErrorMessage(
          response,
          "Atualização não confirmada pelo backend.",
        );
        throw new Error(message);
      }

      console.debug("NEditImported: update confirmed", {
        status,
        updatedExperiment,
      });

      // Also ensure the experiment JSON/basic data is updated via PUT /eyetracking/:id
      try {
        let experimentToSend = {
          ...(experiment || {}),
          basic: {
            ...(experiment?.basic || {}),
            name: name.trim(),
            description: description.trim(),
          },
        };

        // If a new media file was selected, upload it first and attach metadata
        if (mediaFile) {
          try {
            console.debug(
              "NEditImported: uploading media file before updating experiment",
            );
            const uploaded = await uploadExperimentMedia(mediaFile);
            console.debug(
              "NEditImported: uploadExperimentMedia response",
              uploaded,
            );

            const uploadedUrl =
              uploaded?.data?.mediaUrl || uploaded?.mediaUrl || "";
            const uploadedPath =
              uploaded?.data?.mediaPath || uploaded?.mediaPath || "";

            if (
              !experimentToSend.pieces ||
              !Array.isArray(experimentToSend.pieces)
            ) {
              experimentToSend.pieces = [];
            }

            if (experimentToSend.pieces.length === 0) {
              experimentToSend.pieces.push({
                id: "peca-importada-1",
                sampleId: "amostra-importada-1",
                sourceType: "file",
                sourceLabel: mediaFile.name,
                sourceUrl: uploadedUrl,
                fileName: mediaFile.name,
                mimeType: mediaFile.type,
                previewUrl: uploadedUrl,
                mediaPath: uploadedPath,
                previewKind: mediaFile.type.startsWith("video/")
                  ? "video"
                  : "image",
              });
            } else {
              const p = { ...experimentToSend.pieces[0] };
              p.sourceLabel = mediaFile.name;
              p.sourceUrl = uploadedUrl;
              p.fileName = mediaFile.name;
              p.mimeType = mediaFile.type;
              p.previewUrl = uploadedUrl;
              p.mediaPath = uploadedPath;
              p.previewKind = mediaFile.type.startsWith("video/")
                ? "video"
                : "image";
              experimentToSend.pieces[0] = p;
            }
          } catch (uploadErr) {
            console.error(
              "NEditImported: uploadExperimentMedia failed",
              uploadErr,
            );
            // continue and attempt to send metadata even if upload failed
          }
        }

        const payload = buildExperimentPayload(experimentToSend, {
          createdAt: experiment?.createdAt,
        });

        console.debug("NEditImported: sending updateExperiment payload", {
          basic: experimentToSend.basic,
          experimentPayloadTop: {
            name: payload.name,
            description: payload.description,
          },
          piecesTop: experimentToSend.pieces?.slice(0, 1),
        });

        const resp2 = await updateExperiment(recordId, payload);
        console.debug("NEditImported: updateExperiment response", resp2);
      } catch (err) {
        console.error(
          "NEditImported: failed to update experiment via updateExperiment",
          err,
        );
        // don't block success on this, but show a warning
        notifyError(
          "Atualização parcial realizada: metadados não foram atualizados. Verifique o console.",
        );
      }

      notifySuccess("Experimento atualizado com sucesso.");
      navigate("/home");
    } catch (submitError) {
      console.error("NEditImported submit error:", submitError);
      const message = getApiErrorMessage(
        submitError,
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível atualizar o teste.",
      );
      setErrorMessage(message);
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[2rem] bg-white w-full p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-8"
    >
      <div className="grid gap-4 md:grid-cols-1">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Nome do experimento
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-100"
            placeholder="Ex.: Heatmap da leitura"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Descrição
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-sinapgreen-500 focus:ring-2 focus:ring-sinapgreen-100"
          placeholder="Opcional: detalhes do teste importado"
        />
      </label>

      <div className="grid gap-4">
        <label className="group block cursor-pointer rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-sinapgreen-500 hover:bg-sinapgreen-50/40">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="sr-only"
          />
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-sinapgreen-100 p-3 text-sinapgreen-800">
              {mediaKind === "video" ? <VideocamIcon /> : <ImageIcon />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black">
                Alterar imagem ou vídeo de apoio
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Selecione um novo arquivo caso deseje alterar a mídia atual.
              </p>
              <p className="mt-2 truncate text-sm font-medium text-slate-900">
                {mediaFile?.name || "Manter mídia atual"}
              </p>
            </div>
          </div>
        </label>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {mediaPreview || originalMediaUrl ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-sinapgreen-500">
          {mediaKind === "video" ? (
            <video
              src={mediaPreview || originalMediaUrl}
              controls
              className="h-72 w-full object-contain"
            />
          ) : (
            <img
              src={mediaPreview || originalMediaUrl}
              alt="Pré-visualização da mídia"
              className="h-72 w-full object-contain"
            />
          )}
        </div>
      ) : null}

      <div className="flex flex-row flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sinapgreen-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-sinapgreen-500/20 transition hover:bg-sinapgreen-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CloudUploadIcon fontSize="small" />
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
