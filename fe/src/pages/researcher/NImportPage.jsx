import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";

import NPageHeader from "@/components/general/NPageHeader";
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
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-8"
        >
          <div className="grid gap-4 md:grid-cols-1">
            <label className="block flex flex-col gap-2">
              <span className=" block text-sm font-semibold text-slate-700">
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

          <label className="flex flex-col gap-2 block">
            <span className="block text-sm font-semibold text-slate-700">
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

          <div className=" grid gap-5">
            <label className="group block cursor-pointer rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-sinapgreen-500 hover:bg-sinapgreen-50/40">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvChange}
                className="sr-only"
              />
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-sinapgreen-100 p-3 text-sinapgreen-800">
                  <DescriptionIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black">
                    Arquivo CSV
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Clique para selecionar a planilha com as coordenadas. Os
                    campos X e Y são obrigatórios.
                  </p>
                  <p className="mt-2 truncate text-sm font-medium text-slate-900">
                    {csvFile?.name || "Nenhum CSV selecionado"}
                  </p>
                </div>
              </div>
            </label>

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
                    Imagem ou vídeo de apoio
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Use a mídia que será exibida como fundo do heatmap.
                  </p>
                  <p className="mt-2 truncate text-sm font-medium text-slate-900">
                    {mediaFile?.name || "Nenhuma mídia selecionada"}
                  </p>
                </div>
              </div>
            </label>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sinapgreen-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-sinapgreen-500/20 transition hover:bg-sinapgreen-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CloudUploadIcon fontSize="small" />
              {isSubmitting ? "Importando..." : "Importar experimento"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default NImportPage;
