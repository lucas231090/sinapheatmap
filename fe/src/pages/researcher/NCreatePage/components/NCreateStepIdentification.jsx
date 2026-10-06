import {
  ActionButton,
  CardPanel,
  SectionTitle,
} from "@/components/general/NWizardElements";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoopIcon from "@mui/icons-material/Loop";

export default function NCreateStepIdentification({
  participantData,
  onParticipantDataChange,
  onPrevious,
  onNext,
  onReset,
}) {
  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Etapa 2"
        title="Dados demograficos opcionais"
        description="Escolha se o participante podera informar idade e genero. Nenhum nome, CPF ou outro identificador direto sera solicitado."
      />

      <CardPanel className="space-y-4">
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-800">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-sinapgreen-500"
            checked={participantData.collectAge}
            onChange={(event) =>
              onParticipantDataChange("collectAge", event.target.checked)
            }
          />
          <span>
            <span className="block text-sm font-semibold text-black dark:text-white">
              Perguntar a idade
            </span>
            <span className="block text-sm text-slate-600 dark:text-slate-400">
              A idade sera informada voluntariamente no inicio do teste.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-800">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-sinapgreen-500"
            checked={participantData.collectGender}
            onChange={(event) =>
              onParticipantDataChange("collectGender", event.target.checked)
            }
          />
          <span>
            <span className="block text-sm font-semibold text-black dark:text-white">
              Perguntar o genero
            </span>
            <span className="block text-sm text-slate-600 dark:text-slate-400">
              O participante podera responder ou preferir nao informar.
            </span>
          </span>
        </label>
      </CardPanel>

      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
        <ActionButton icon={<LoopIcon />} variant="ghost" onClick={onReset}>
          Reset
        </ActionButton>
        <div className="flex gap-3">
          <ActionButton icon={<ArrowBackIcon />} variant="ghost" onClick={onPrevious}>
            Voltar
          </ActionButton>
          <ActionButton icon={<ArrowForwardIcon />} onClick={onNext}>
            Proximo
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
