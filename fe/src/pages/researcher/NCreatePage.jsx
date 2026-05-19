import NPageHeader from "@/components/general/NPageHeader";
import NCreateWizardStepper from "@/pages/researcher/NCreatePage/components/NCreateWizardStepper";
import NCreateStepBasic from "@/pages/researcher/NCreatePage/components/NCreateStepBasic";
import NCreateStepIdentification from "@/pages/researcher/NCreatePage/components/NCreateStepIdentification";
import NCreateStepAssets from "@/pages/researcher/NCreatePage/components/NCreateStepAssets";
import NCreateStepOrganization from "@/pages/researcher/NCreatePage/components/NCreateStepOrganization";
import { useCreateExperimentWizard } from "@/hooks/useCreateExperimentWizard";

const stepLabels = [
  "Dados básicos",
  "Identificação",
  "Amostras e peças",
  "Organização final",
];

function NCreatePage() {
  const wizard = useCreateExperimentWizard();

  return (
    <div className=" text-black">
      <div className="mx-auto flex w-full flex-col gap-10">
        <NPageHeader
          title="CRIAR EXPERIMENTO"
          description="Fluxo em 4 etapas para configurar o experimento de eyetracking com dados, participantes, amostras, peças e organização final."
        />

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
              onReset={wizard.resetWizard}
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
              onReset={wizard.resetWizard}
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
              onReset={wizard.resetWizard}
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
              onNext={wizard.createExperimentRequest}
              onReset={wizard.resetWizard}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default NCreatePage;
