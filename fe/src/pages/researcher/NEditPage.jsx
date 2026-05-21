import NPageHeader from "@/components/general/NPageHeader";
import NCreateWizardStepper from "@/pages/researcher/NCreatePage/components/NCreateWizardStepper";
import NCreateStepBasic from "@/pages/researcher/NCreatePage/components/NCreateStepBasic";
import NCreateStepIdentification from "@/pages/researcher/NCreatePage/components/NCreateStepIdentification";
import NCreateStepAssets from "@/pages/researcher/NCreatePage/components/NCreateStepAssets";
import NCreateStepOrganization from "@/pages/researcher/NCreatePage/components/NCreateStepOrganization";
import { useEditExperimentWizard } from "@/hooks/useEditExperimentWizard";
import NEditImported from "@/pages/researcher/NEditPage/NEditImported";
import { useNavigate } from "react-router-dom";

const stepLabels = [
  "Dados basicos",
  "Identificacao",
  "Amostras e pecas",
  "Organizacao final",
];

function NEditPage() {
  const wizard = useEditExperimentWizard();
  const navigate = useNavigate();

  if (wizard.isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] bg-white p-6 text-center text-sm font-semibold text-slate-600 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        Carregando dados do experimento...
      </section>
    );
  }

  if (wizard.loadError) {
    return (
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] bg-white p-6 text-center text-sm font-semibold text-red-700 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        {wizard.loadError}
      </section>
    );
  }

  const isImported = wizard.experiment.basic.isImported;

  return (
    <div className="text-black">
      <div className="mx-auto flex w-full flex-col gap-10">
        <NPageHeader
          title="EDITAR EXPERIMENTO"
          description={
            isImported
              ? "Edite o nome, descrição ou mídia do experimento importado."
              : "Revise os dados do experimento e ajuste amostras, participantes, pecas e organizacao final."
          }
        />

        {isImported ? (
          <main className="flex  items-center justify-center w-full">
            <NEditImported
              experiment={wizard.experiment}
              onCancel={() => navigate("/home")}
            />
          </main>
        ) : (
          <>
            <NCreateWizardStepper
              activeStep={wizard.activeStep}
              labels={stepLabels}
            />

            {wizard.submissionError ? (
              <div className="rounded-[1.5rem] border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
                {wizard.submissionError}
              </div>
            ) : null}

            <main className="rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] lg:p-8">
              {wizard.activeStep === 1 ? (
                <NCreateStepBasic
                  basic={wizard.experiment.basic}
                  onFieldChange={wizard.updateBasicField}
                  onReset={wizard.resetToLoaded}
                  onNext={wizard.goToNextStep}
                />
              ) : null}

              {wizard.activeStep === 2 ? (
                <NCreateStepIdentification
                  identification={wizard.experiment.identification}
                  participants={wizard.experiment.participants}
                  participantsText={wizard.participantsText}
                  onIdentificationChange={wizard.updateIdentificationField}
                  onParticipantsTextChange={wizard.setParticipantsText}
                  onImportParticipants={wizard.importParticipants}
                  onParticipantChange={wizard.updateParticipantField}
                  onAddParticipantRow={wizard.addParticipantRow}
                  onRemoveParticipantRow={wizard.removeParticipantRow}
                  onPrevious={wizard.goToPreviousStep}
                  onNext={wizard.goToNextStep}
                  onReset={wizard.resetToLoaded}
                />
              ) : null}

              {wizard.activeStep === 3 ? (
                <NCreateStepAssets
                  samples={wizard.experiment.samples}
                  pieces={wizard.experiment.pieces}
                  sampleDraft={wizard.sampleDraft}
                  pieceDraft={wizard.pieceDraft}
                  selectedSampleId={wizard.selectedSampleId}
                  selectedPieceId={wizard.selectedPieceId}
                  fileInputRef={wizard.fileInputRef}
                  onSampleDraftChange={wizard.updateSampleDraft}
                  onPieceDraftChange={wizard.updatePieceDraft}
                  onSampleSelect={wizard.selectSampleForEdit}
                  onPieceSelect={wizard.selectPieceForEdit}
                  onSampleSave={() => wizard.saveSampleDraft(false)}
                  onSampleCreateNew={() => wizard.saveSampleDraft(true)}
                  onPieceSave={() => wizard.savePieceDraft(false)}
                  onPieceCreateNew={() => wizard.savePieceDraft(true)}
                  onSampleDelete={wizard.deleteSample}
                  onPieceDelete={wizard.deletePiece}
                  onSampleMove={wizard.moveSample}
                  onPieceMove={wizard.movePiece}
                  onFileUploadClick={() => wizard.fileInputRef.current?.click()}
                  onFileSelected={wizard.handlePieceFileSelected}
                  onPrevious={wizard.goToPreviousStep}
                  onNext={wizard.goToNextStep}
                  onReset={wizard.resetToLoaded}
                  canAdvance={wizard.canContinueToOrganization}
                />
              ) : null}

              {wizard.activeStep === 4 ? (
                <NCreateStepOrganization
                  samples={wizard.experiment.samples}
                  pieces={wizard.experiment.pieces}
                  organization={wizard.experiment.organization}
                  selectedOrganizationSampleId={wizard.organizationSampleId}
                  onOrganizationFieldChange={wizard.updateOrganizationField}
                  onSelectOrganizationSample={wizard.setOrganizationSampleId}
                  onSampleMove={wizard.moveSample}
                  onPieceMove={wizard.movePiece}
                  onPrevious={wizard.goToPreviousStep}
                  onNext={wizard.saveExperimentRequest}
                  onReset={wizard.resetToLoaded}
                  submitLabel="Salvar alteracoes"
                  isSubmitting={wizard.isSubmitting}
                />
              ) : null}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default NEditPage;
