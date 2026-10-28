import { useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";

import NPageHeader from "@/components/general/NPageHeader";
import Card from "@/components/general/Card";
import Input from "@/components/general/Input";
import Textarea from "@/components/general/Textarea";
import Button from "@/components/general/Button";
import FileUpload from "@/components/general/FileUpload";
import { useNotifications } from "@/hooks/useNotifications";
import { getApiErrorMessage } from "@/services/api";
import { importHeatmap } from "@/services/eyetrackingService";
import {
  buildImportedSessionsFromCsv,
  fileToDataUrl,
} from "@/utils/importExperiment";

function NImportPage() {
  const navigate = useNavigate();
  const { notifyError, notifySuccess } = useNotifications();

  const [formState, dispatchForm] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "SET_FIELD":
          return { ...state, [action.field]: action.value, errorMessage: "" };
        case "SET_MEDIA":
          return { ...state, media: action.value, errorMessage: "" };
        case "SET_ERROR":
          return { ...state, errorMessage: action.payload };
        case "SUBMIT_START":
          return { ...state, isSubmitting: true, errorMessage: "" };
        case "SUBMIT_SUCCESS":
          return { ...state, isSubmitting: false, errorMessage: "" };
        case "SUBMIT_FAILURE":
          return { ...state, isSubmitting: false, errorMessage: action.payload };
        default:
          return state;
      }
    },
    {
      name: "",
      description: "",
      media: { file: null, preview: "" },
      csvFile: null,
      isSubmitting: false,
      errorMessage: "",
    }
  );

  const { name, description, media, csvFile, isSubmitting, errorMessage } = formState;

  const mediaKind = useMemo(() => {
    if (!media.file) {
      return "image";
    }

    return media.file.type.startsWith("video/") ? "video" : "image";
  }, [media.file]);

  const handleCsvChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    dispatchForm({ type: "SET_FIELD", field: "csvFile", value: selectedFile });

    if (!selectedFile) {
      return;
    }

    try {
      const text = await selectedFile.text();
      buildImportedSessionsFromCsv(text);
    } catch (csvError) {
      console.error("Import page CSV parse error:", csvError);
      dispatchForm({ type: "SET_ERROR", payload: "Não foi possível ler o CSV selecionado." });
    }
  };

  const handleMediaChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      dispatchForm({ type: "SET_MEDIA", value: { file: null, preview: "" } });
      return;
    }

    try {
      const previewUrl = await fileToDataUrl(selectedFile);
      dispatchForm({ type: "SET_MEDIA", value: { file: selectedFile, preview: previewUrl } });
    } catch (mediaError) {
      console.error("Import page media read error:", mediaError);
      dispatchForm({ type: "SET_MEDIA", value: { file: selectedFile, preview: "" } });
      dispatchForm({ type: "SET_ERROR", payload: "Não foi possível preparar a pré-visualização da mídia." });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      dispatchForm({ type: "SET_ERROR", payload: "Informe o nome do experimento." });
      return;
    }

    if (!csvFile) {
      dispatchForm({ type: "SET_ERROR", payload: "Selecione o arquivo CSV para importar." });
      return;
    }

    if (!media.file) {
      dispatchForm({ type: "SET_ERROR", payload: "Selecione a imagem ou vídeo de apoio." });
      return;
    }

    dispatchForm({ type: "SUBMIT_START" });

    try {
      const formData = new FormData();
      formData.append("filename", name.trim());
      formData.append("description", description.trim());
      formData.append("csvFile", csvFile);
      formData.append("mediaFile", media.file);

      const response = await importHeatmap(formData);
      const createdExperiment = response?.data?.data || response?.data || {};
      const createdId = createdExperiment?._id || createdExperiment?.id;

      notifySuccess("Experimento importado com sucesso.");
      dispatchForm({ type: "SUBMIT_SUCCESS" });

      if (createdId) {
        navigate(`/heatmap/${createdId}`);
        return;
      }

      navigate("/home");
    } catch (submitError) {
      const message = getApiErrorMessage(
        submitError,
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível importar o teste.",
      );
      dispatchForm({ type: "SUBMIT_FAILURE", payload: message });
      notifyError(message);
    }
  };

  return (
    <section className="flex flex-col gap-10">
      <NPageHeader
        title="Importar experimento"
        description="Envie um CSV com coordenadas de eyetracking e uma mídia de apoio para gerar um teste importado pronto para análise."
      />

      <div className="gap-6 ">
        <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-1">
            <label className="block flex flex-col gap-2" htmlFor="import-name">
              <span className=" block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nome do experimento
              </span>
              <Input
                id="import-name"
                value={name}
                onChange={(event) => dispatchForm({ type: "SET_FIELD", field: "name", value: event.target.value })}
                placeholder="Ex.: Heatmap da leitura"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 block" htmlFor="import-desc">
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Descrição
            </span>
            <Textarea
              id="import-desc"
              value={description}
              onChange={(event) => dispatchForm({ type: "SET_FIELD", field: "description", value: event.target.value })}
              rows={4}
              className="rounded-3xl focus:ring-2 focus:ring-sinapgreen-100"
              placeholder="Opcional: detalhes do teste importado"
            />
          </label>

          <div className=" grid gap-5">
            <FileUpload
              accept=".csv,text/csv"
              onChange={handleCsvChange}
              title="Arquivo CSV"
              subtitle="Clique para selecionar a planilha com as coordenadas. Os campos X e Y são obrigatórios."
              fileName={csvFile?.name}
              icon={<DescriptionIcon />}
            />

            <FileUpload
              accept="image/*,video/*"
              onChange={handleMediaChange}
              title="Imagem ou vídeo de apoio"
              subtitle="Use a mídia que será exibida como fundo do heatmap."
              fileName={media.file?.name}
              icon={mediaKind === "video" ? <VideocamIcon /> : <ImageIcon />}
            />
          </div>

          {errorMessage ? (
            <div className=" rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {media.preview ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-sinapgreen-500">
              {mediaKind === "video" ? (
                <video
                  src={media.preview}
                  controls
                  aria-label="Pré-visualização do vídeo"
                  className="h-72 w-full object-contain"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <img
                  src={media.preview}
                  alt="Pré-visualização da mídia"
                  className="h-72 w-full object-contain"
                />
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              <CloudUploadIcon fontSize="small" className="mr-2" />
              {isSubmitting ? "Importando..." : "Importar experimento"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/home")}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default NImportPage;
