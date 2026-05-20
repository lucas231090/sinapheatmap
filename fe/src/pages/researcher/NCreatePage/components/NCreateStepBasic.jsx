import {
  ActionButton,
  InputField,
  SectionTitle,
  TextAreaField,
} from "@/components/general/NWizardElements";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoopIcon from "@mui/icons-material/Loop";

export default function NCreateStepBasic({
  basic,
  onFieldChange,
  onReset,
  onNext,
}) {
  return (
    <div className="space-y-4">
      <SectionTitle
        kicker="Etapa 1"
        title="Dados básicos"
        description="Configure o nome do experimento, o período de execução e as regras de exibição iniciais."
      />

      {/* Nome e datas */}
      <div className="grid gap-5 lg:grid-cols-2">
        <InputField
          label="Nome *"
          value={basic.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Ex: Experimento de navegação ciano"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField
            label="Data de começo"
            type="date"
            value={basic.startDate}
            onChange={(event) => onFieldChange("startDate", event.target.value)}
          />
          <InputField
            label="Data de fim"
            type="date"
            value={basic.endDate}
            onChange={(event) => onFieldChange("endDate", event.target.value)}
          />
        </div>
      </div>

      {/*  Descrição e opções*/}
      <div className="grid gap-5 lg:grid-cols-2">
        <TextAreaField
          label="Descrição"
          value={basic.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          placeholder="Descreva o objetivo, público e contexto do teste."
        />

        <div className="flex flex-col space-y-4">
          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-sinapgreen-500"
              checked={basic.showDescriptionOnTest}
              onChange={(event) =>
                onFieldChange("showDescriptionOnTest", event.target.checked)
              }
            />
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-black">
                Mostrar a descrição no teste
              </span>
              <span className="block text-sm text-slate-600">
                A descrição ficará visível para o participante.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-sinapgreen-500"
              checked={basic.allowMultipleSessions}
              onChange={(event) =>
                onFieldChange("allowMultipleSessions", event.target.checked)
              }
            />
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-black">
                Possibilitar múltiplas testagens numa mesma sessão
              </span>
              <span className="block text-sm text-slate-600">
                Um mesmo usuário testar várias vezes.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
        <ActionButton icon={<LoopIcon />} variant="ghost" onClick={onReset}>
          Reset
        </ActionButton>
        <ActionButton icon={<ArrowForwardIcon />} onClick={onNext}>
          Próximo
        </ActionButton>
      </div>
    </div>
  );
}
