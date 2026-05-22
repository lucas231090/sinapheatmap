import { useEffect } from "react";
import {
  ActionButton,
  CardPanel,
  InputField,
  RowCard,
  SectionTitle,
  TextAreaField,
} from "@/components/general/NWizardElements";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LoopIcon from "@mui/icons-material/Loop";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";

function PreviewIcon({ kind }) {
  return kind === "video" ? <MovieOutlinedIcon /> : <ImageOutlinedIcon />;
}

export default function NCreateStepAssets({
  samples,
  pieces,
  sampleDraft,
  pieceDraft,
  selectedSampleId,
  selectedPieceId,
  fileInputRef,
  onSampleDraftChange,
  onPieceDraftChange,
  onSampleSelect,
  onPieceSelect,
  onSampleSave,
  onSampleCreateNew,
  onPieceSave,
  onPieceCreateNew,
  onSampleDelete,
  onPieceDelete,
  onSampleMove,
  onPieceMove,
  onFileUploadClick,
  onFileSelected,
  onPrevious,
  onNext,
  onReset,
  canAdvance,
}) {
  const hasUrl =
    pieceDraft.sourceType === "url" && Boolean(pieceDraft.sourceUrl?.trim());
  const hasFile =
    pieceDraft.sourceType === "file" && Boolean(pieceDraft.sourceLabel);
  const fileLabel = pieceDraft.fileName || pieceDraft.sourceLabel;

  useEffect(() => {
    if (!samples.length) {
      onPieceDraftChange("sampleId", "");
      return;
    }

    if (
      !pieceDraft.sampleId ||
      !samples.some((sample) => sample.id === pieceDraft.sampleId)
    ) {
      onPieceDraftChange("sampleId", samples[0].id);
    }
  }, [onPieceDraftChange, pieceDraft.sampleId, samples]);

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Etapa 3"
        title="Amostras e peças"
        description="Crie uma amostra, salve, depois crie as peças vinculadas a ela. Você pode editar um item clicando nele na lista."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CardPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle kicker="Crie uma amostra +" title="Amostras" />
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {samples.length} cadastrada(s)
            </span>
          </div>

          <InputField
            label="Nome *"
            value={sampleDraft.name}
            onChange={(event) =>
              onSampleDraftChange("name", event.target.value)
            }
            placeholder="Ex: Azul"
          />
          <TextAreaField
            label="Descrição"
            value={sampleDraft.description}
            onChange={(event) =>
              onSampleDraftChange("description", event.target.value)
            }
            placeholder="Descreva a amostra."
            className="min-h-[110px]"
          />

          <div className="flex flex-wrap gap-3">
            <ActionButton icon={<SaveOutlinedIcon />} onClick={onSampleSave}>
              Salvar amostra
            </ActionButton>
            <ActionButton
              icon={<AddIcon />}
              variant="ghost"
              onClick={onSampleCreateNew}
            >
              Nova amostra
            </ActionButton>
          </div>

          <div className="max-h-[330px] space-y-3 overflow-auto pr-1">
            {samples.length ? (
              samples.map((sample) => (
                <RowCard
                  key={sample.id}
                  title={sample.name || "Amostra sem nome"}
                  subtitle={sample.description || "Sem descrição"}
                  badge={`${
                    pieces.filter((piece) => piece.sampleId === sample.id)
                      .length
                  } peça(s)`}
                  thumbnail={<div className="h-10 w-10 rounded-xl bg-white" />}
                  selected={sample.id === selectedSampleId}
                  orientation="vertical"
                  onClick={() => onSampleSelect(sample.id)}
                  onDelete={() => onSampleDelete(sample.id)}
                  onMoveLeft={() => onSampleMove(sample.id, -1)}
                  onMoveRight={() => onSampleMove(sample.id, 1)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                Nenhuma amostra criada ainda.
              </div>
            )}
          </div>
        </CardPanel>

        <CardPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle kicker="Crie uma peça +" title="Peças" />
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {pieces.length} cadastrada(s)
            </span>
          </div>

          {!samples.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Crie ao menos uma amostra para começar a adicionar peças.
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={onFileSelected}
                disabled={hasUrl}
              />

              {hasFile ? (
                <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-black">
                        <PreviewIcon kind={pieceDraft.previewKind} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-black">
                          Arquivo adicionado
                        </p>
                        <p className="text-xs text-slate-600">
                          {fileLabel || "Arquivo selecionado"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onPieceDraftChange("sourceLabel", "");
                        onPieceDraftChange("fileName", "");
                        onPieceDraftChange("mimeType", "");
                        onPieceDraftChange("previewUrl", "");
                        onPieceDraftChange("sourceUrl", "");
                        onPieceDraftChange("mediaPath", "");
                        onPieceDraftChange("previewKind", "image");
                        onPieceDraftChange("sourceType", "file");
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-red-50"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <ActionButton
                  icon={<CloudUploadIcon />}
                  onClick={onFileUploadClick}
                  disabled={hasUrl}
                >
                  Insira imagem/vídeo
                </ActionButton>
              )}

              <InputField
                label="OU URL da imagem/vídeo"
                value={pieceDraft.sourceUrl}
                onChange={(event) => {
                  const value = event.target.value;
                  onPieceDraftChange("sourceUrl", value);
                  onPieceDraftChange(
                    "sourceType",
                    value.trim() ? "url" : "file",
                  );
                  if (value.trim()) {
                    onPieceDraftChange("sourceLabel", "");
                    onPieceDraftChange("fileName", "");
                    onPieceDraftChange("mimeType", "");
                    onPieceDraftChange("previewUrl", "");
                    onPieceDraftChange("previewKind", "image");
                  }
                }}
                placeholder="https://..."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Tempo de exposição *"
                  value={pieceDraft.exposureSeconds}
                  onChange={(event) =>
                    onPieceDraftChange("exposureSeconds", event.target.value)
                  }
                  placeholder="10s"
                />

                <label className="block space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
                    Amostra
                  </span>
                  <select
                    value={pieceDraft.sampleId}
                    onChange={(event) =>
                      onPieceDraftChange("sampleId", event.target.value)
                    }
                    className="w-full rounded-2xl border border-black/15 bg-slate-100 px-4 py-3 text-sm text-black shadow-sm transition focus:border-sinapgreen-500 focus:bg-white focus:outline-none"
                  >
                    {samples.map((sample) => (
                      <option key={sample.id} value={sample.id}>
                        {sample.name || "Amostra sem nome"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
                    Exibição da Imagem
                  </span>
                  <select
                    value={pieceDraft.imageDisplayMode || "original"}
                    onChange={(event) =>
                      onPieceDraftChange("imageDisplayMode", event.target.value)
                    }
                    className="w-full rounded-2xl border border-black/15 bg-slate-100 px-4 py-3 text-sm text-black shadow-sm transition focus:border-sinapgreen-500 focus:bg-white focus:outline-none"
                  >
                    <option value="original">
                      Tamanho Original (redimensiona mantendo a proporção)
                    </option>
                    <option value="cover">
                      Preencher Tela (pode cortar bordas da imagem)
                    </option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton icon={<SaveOutlinedIcon />} onClick={onPieceSave}>
                  Salvar peça
                </ActionButton>
                <ActionButton
                  icon={<AddIcon />}
                  variant="ghost"
                  onClick={onPieceCreateNew}
                >
                  Nova peça
                </ActionButton>
              </div>

              <div className="max-h-[330px] space-y-3 overflow-auto pr-1">
                {pieces.length ? (
                  pieces.map((piece) => {
                    const sampleName =
                      samples.find((sample) => sample.id === piece.sampleId)
                        ?.name || "Amostra vinculada";

                    return (
                      <RowCard
                        key={piece.id}
                        title={
                          piece.sourceLabel || piece.fileName || "Peça sem nome"
                        }
                        subtitle={`${sampleName} • ${piece.exposureSeconds}s`}
                        badge={piece.sourceType === "url" ? "URL" : "arquivo"}
                        thumbnail={<PreviewIcon kind={piece.previewKind} />}
                        selected={piece.id === selectedPieceId}
                        orientation="vertical"
                        onClick={() => onPieceSelect(piece.id)}
                        onDelete={() => onPieceDelete(piece.id)}
                        onMoveLeft={() => onPieceMove(piece.id, -1)}
                        onMoveRight={() => onPieceMove(piece.id, 1)}
                      />
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                    Nenhuma peça criada ainda.
                  </div>
                )}
              </div>
            </>
          )}
        </CardPanel>
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
        <ActionButton icon={<LoopIcon />} variant="ghost" onClick={onReset}>
          Reset
        </ActionButton>
        <div className="flex gap-3">
          <ActionButton
            icon={<ArrowBackIcon />}
            variant="ghost"
            onClick={onPrevious}
          >
            Voltar
          </ActionButton>
          <ActionButton
            icon={<ArrowForwardIcon />}
            onClick={onNext}
            disabled={!canAdvance}
          >
            Próximo
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
