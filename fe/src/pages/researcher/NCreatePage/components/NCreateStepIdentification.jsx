import {
  ActionButton,
  CardPanel,
  InputField,
  SectionTitle,
  TextAreaField,
} from "@/components/general/NWizardElements";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LoopIcon from "@mui/icons-material/Loop";

function ParticipantTable({ participants, onChange, onAddRow, onRemoveRow }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1.4fr_1fr_auto] border-b border-slate-200 bg-sinapgreen-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-900">
        <span>Nome</span>
        <span>CPF</span>
        <span className="text-right">Ações</span>
      </div>
      <div className="max-h-[320px] divide-y divide-slate-200 overflow-auto">
        {participants.length ? (
          participants.map((participant) => (
            <div
              key={participant.id}
              className="grid grid-cols-[1.4fr_1fr_auto] gap-3 px-4 py-3"
            >
              <input
                value={participant.name}
                onChange={(event) =>
                  onChange(participant.id, "name", event.target.value)
                }
                placeholder="Nome"
                className="w-full rounded-2xl border border-black/15 bg-slate-100 px-3 py-2 text-sm text-black placeholder:text-slate-500 focus:border-sinapgreen-500 focus:outline-none"
              />
              <input
                value={participant.cpf}
                onChange={(event) =>
                  onChange(participant.id, "cpf", event.target.value)
                }
                placeholder="CPF"
                className="w-full rounded-2xl border border-black/15 bg-slate-100 px-3 py-2 text-sm text-black placeholder:text-slate-500 focus:border-sinapgreen-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onRemoveRow(participant.id)}
                className="rounded-full bg-slate-100 p-2 text-black transition hover:bg-red-50"
                aria-label="Remover participante"
              >
                <DeleteOutlineIcon fontSize="small" />
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-slate-500">
            Nenhum participante cadastrado ainda. Use o botão abaixo para criar
            a primeira linha.
          </div>
        )}
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <ActionButton
          icon={<AddCircleOutlineIcon />}
          variant="ghost"
          onClick={onAddRow}
        >
          Adicionar linha
        </ActionButton>
      </div>
    </div>
  );
}

export default function NCreateStepIdentification({
  identification,
  participants,
  participantsText,
  onIdentificationChange,
  onParticipantsTextChange,
  onImportParticipants,
  onParticipantChange,
  onAddParticipantRow,
  onRemoveParticipantRow,
  onPrevious,
  onNext,
  onReset,
}) {
  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Etapa 2"
        title="Identificação e participantes"
        description="Defina se o participante vai se identificar e edite a lista de participantes diretamente na tabela."
      />

      <CardPanel className="flex flex-row items-center justify-between gap-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-sinapgreen-500"
            checked={identification.required}
            onChange={(event) =>
              onIdentificationChange("required", event.target.checked)
            }
          />
          <span className="space-y-1">
            <span className="block text-sm font-semibold text-black">
              O usuário precisa se identificar?
            </span>
            <span className="block text-sm text-slate-600">
              Ative essa opção para exigir dados de identificação antes de
              iniciar o teste.
            </span>
          </span>
        </label>

        <div className=" grid gap-3 sm:grid-cols-3">
          {[
            { value: "nome", label: "Nome" },
            { value: "cpf", label: "CPF" },
            { value: "nome-cpf", label: "Nome e CPF" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm"
            >
              <input
                type="radio"
                name="identification-mode"
                value={option.value}
                checked={identification.mode === option.value}
                onChange={(event) =>
                  onIdentificationChange("mode", event.target.value)
                }
                disabled={!identification.required}
                className="h-4 w-4 accent-sinapgreen-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      </CardPanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <CardPanel className="space-y-4">
          <SectionTitle
            kicker="Lista de participação"
            title="Cole a lista dos participantes"
            description="Você pode colar uma lista no formato Nome, CPF ou preencher a tabela diretamente."
          />
          <TextAreaField
            label="Cole sua lista"
            value={participantsText}
            onChange={(event) => onParticipantsTextChange(event.target.value)}
            placeholder="Cole sua lista aqui no formato: Nome, CPF;"
            className="min-h-[220px]"
          />
          <ActionButton
            icon={<CloudUploadIcon />}
            onClick={onImportParticipants}
          >
            Importar lista
          </ActionButton>
        </CardPanel>

        <CardPanel className="space-y-4">
          <SectionTitle
            kicker="Pré-visualização"
            title="Tabela dinâmica"
            description="Campos editáveis para montar a lista sem precisar de dados mockados."
          />
          <ParticipantTable
            participants={participants}
            onChange={onParticipantChange}
            onAddRow={onAddParticipantRow}
            onRemoveRow={onRemoveParticipantRow}
          />
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
          <ActionButton icon={<ArrowForwardIcon />} onClick={onNext}>
            Próximo
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
