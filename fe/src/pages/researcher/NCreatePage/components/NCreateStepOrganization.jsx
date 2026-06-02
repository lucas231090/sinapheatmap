import {
  ActionButton,
  CardPanel,
  RowCard,
  SectionTitle,
} from "@/components/general/NWizardElements";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoopIcon from "@mui/icons-material/Loop";

export default function NCreateStepOrganization({
  samples,
  pieces,
  organization,
  selectedOrganizationSampleId,
  onOrganizationFieldChange,
  onSelectOrganizationSample,
  onSampleMove,
  onPieceMove,
  onPrevious,
  onNext,
  onReset,
  submitLabel = "Criar",
  submitIcon,
  isSubmitting = false,
}) {
  const finalIcon = submitIcon || <ArrowForwardIcon />;
  const selectedPieces = pieces.filter(
    (piece) => piece.sampleId === selectedOrganizationSampleId,
  );

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Etapa 4"
        title="Organização final"
        description="Reordene apenas quando a randomização estiver desativada. Se a ordenação for automática, os controles ficam bloqueados."
      />

      <CardPanel className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionTitle
            kicker="Organizar amostras"
            title="ORGANIZAR AMOSTRAS"
            description="Ative a randomização para embaralhar a sequência ao iniciar o teste."
          />
          <label
            className="flex items-center gap-3 rounded-full bg-white dark:bg-slate-700 px-4 py-3 text-sm font-semibold shadow-sm"
            htmlFor="org-rand-samples"
          >
            <input
              id="org-rand-samples"
              type="checkbox"
              className="size-4 accent-sinapgreen-500"
              checked={organization.randomizeSamples}
              onChange={(event) =>
                onOrganizationFieldChange(
                  "randomizeSamples",
                  event.target.checked,
                )
              }
            />
            Randomizar sequência de amostras
          </label>
        </div>

        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          <span>Primeiro</span>
          <span>Último</span>
        </div>

        {organization.randomizeSamples ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white dark:bg-slate-700 p-6 text-sm text-slate-500">
            A randomização de amostras está ativa. A organização manual foi
            bloqueada.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {samples.map((sample) => (
              <div key={sample.id} className="min-w-[220px] flex-shrink-0">
                <RowCard
                  title={sample.name || "Amostra sem nome"}
                  subtitle={sample.description || "Sem descrição"}
                  badge={`${
                    pieces.filter((piece) => piece.sampleId === sample.id)
                      .length
                  } peça(s)`}
                  thumbnail={<div className="size-10 rounded-xl bg-white" />}
                  selected={sample.id === selectedOrganizationSampleId}
                  onClick={() => onSelectOrganizationSample(sample.id)}
                  onMoveLeft={() => onSampleMove(sample.id, -1)}
                  onMoveRight={() => onSampleMove(sample.id, 1)}
                  controlsDisabled={organization.randomizeSamples}
                />
              </div>
            ))}
          </div>
        )}
      </CardPanel>

      <CardPanel className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionTitle
            kicker="Organizar peças"
            title="ORGANIZAR PEÇAS"
            description="Escolha a amostra para organizar apenas as peças que pertencem a ela."
          />
          <label
            className="flex items-center gap-3 rounded-full bg-white dark:bg-slate-700 px-4 py-3 text-sm font-semibold shadow-sm"
            htmlFor="org-rand-pieces"
          >
            <input
              id="org-rand-pieces"
              type="checkbox"
              className="size-4 accent-sinapgreen-500"
              checked={organization.randomizePieces}
              onChange={(event) =>
                onOrganizationFieldChange(
                  "randomizePieces",
                  event.target.checked,
                )
              }
            />
            Randomizar sequência de peças dentro dessa amostra
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectOrganizationSample(sample.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedOrganizationSampleId === sample.id
                  ? "bg-sinapgreen-500 text-black"
                  : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              }`}
            >
              {sample.name || "Amostra sem nome"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          <span>Primeiro</span>
          <span>Último</span>
        </div>

        {organization.randomizePieces ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white dark:bg-slate-700 p-6 text-sm text-slate-500">
            A randomização de peças está ativa. A organização manual foi
            bloqueada.
          </div>
        ) : selectedPieces.length ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {selectedPieces.map((piece) => (
              <div key={piece.id} className="min-w-[240px] flex-shrink-0">
                <RowCard
                  title={piece.sourceLabel || piece.fileName || "Peça sem nome"}
                  subtitle={`${piece.exposureSeconds}s • ${
                    piece.sourceType === "url" ? "URL" : "Arquivo"
                  }`}
                  badge={piece.sourceType === "url" ? "URL" : "arquivo"}
                  thumbnail={<div className="size-10 rounded-xl bg-white" />}
                  onMoveLeft={() => onPieceMove(piece.id, -1)}
                  onMoveRight={() => onPieceMove(piece.id, 1)}
                  controlsDisabled={organization.randomizePieces}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white dark:bg-slate-700 p-6 text-sm text-slate-500 dark:text-slate-400">
            Selecione uma amostra com peças para organizá-las.
          </div>
        )}
      </CardPanel>

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
            icon={finalIcon}
            onClick={onNext}
            disabled={isSubmitting}
          >
            {submitLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
