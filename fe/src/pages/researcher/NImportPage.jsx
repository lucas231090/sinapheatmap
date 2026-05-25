import { useMemo, useState } from "react";
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [, setCsvSummary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const mediaKind = useMemo(() => {
    if (!mediaFile) {
      return "image";
    }

    return mediaFile.type.startsWith("video/") ? "video" : "image";
  }, [mediaFile]);

  const handleCsvChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setCsvFile(selectedFile);
    setErrorMessage("");

    if (!selectedFile) {
      setCsvSummary(null);
      return;
    }

    try {
      const text = await selectedFile.text();
      const preview = buildImportedSessionsFromCsv(text);
      setCsvSummary(preview);
    } catch (csvError) {
      console.error("Import page CSV parse error:", csvError);
      setCsvSummary(null);
      setErrorMessage("Não foi possível ler o CSV selecionado.");
    }
  };

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
      console.error("Import page media read error:", mediaError);
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

    if (!csvFile) {
      setErrorMessage("Selecione o arquivo CSV para importar.");
      return;
    }

    if (!mediaFile) {
      setErrorMessage("Selecione a imagem ou vídeo de apoio.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("filename", name.trim());
      formData.append("description", description.trim());
      formData.append("csvFile", csvFile);
      formData.append("mediaFile", mediaFile);

      const response = await importHeatmap(formData);
      const createdExperiment = response?.data?.data || response?.data || {};
      const createdId = createdExperiment?._id || createdExperiment?.id;

      notifySuccess("Experimento importado com sucesso.");

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
      setErrorMessage(message);
      notifyError(message);
    } finally {
      setIsSubmitting(false);
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
            <label className="block flex flex-col gap-2">
              <span className=" block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nome do experimento
              </span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Heatmap da leitura"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 block">
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Descrição
            </span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
              fileName={mediaFile?.name}
              icon={mediaKind === "video" ? <VideocamIcon /> : <ImageIcon />}
            />
          </div>

          {errorMessage ? (
            <div className=" rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {mediaPreview ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-sinapgreen-500">
              {mediaKind === "video" ? (
                <video
                  src={mediaPreview}
                  controls
                  className="h-72 w-full object-contain"
                />
              ) : (
                <img
                  src={mediaPreview}
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
