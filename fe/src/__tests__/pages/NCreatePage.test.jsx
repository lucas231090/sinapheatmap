import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NCreatePage from "@/pages/researcher/NCreatePage";
import { useCreateExperimentWizard } from "@/hooks/useCreateExperimentWizard";

vi.mock("@/hooks/useCreateExperimentWizard");

vi.mock(
  "@/pages/researcher/NCreatePage/components/NCreateStepBasic", async () => ({ default: () => <div>StepBasic</div> })
);

vi.mock(
  "@/pages/researcher/NCreatePage/components/NCreateStepIdentification", async () => ({ default: () => <div>StepIdentification</div> })
);

vi.mock(
  "@/pages/researcher/NCreatePage/components/NCreateStepAssets", async () => ({ default: () => <div>StepAssets</div> })
);

vi.mock(
  "@/pages/researcher/NCreatePage/components/NCreateStepOrganization", async () => ({ default: () => <div>StepOrganization</div> })
);

describe("NCreatePage", () => {
  const buildWizard = () => ({
    activeStep: 1,
    experiment: {
      basic: {},
      identification: {},
      participants: [],
      samples: [],
      pieces: [],
      organization: {},
    },
    participantsText: "",
    sampleDraft: {},
    pieceDraft: {},
    selectedSampleId: "",
    selectedPieceId: "",
    fileInputRef: { current: null },
    organizationSampleId: "",
    submissionError: "",
    updateBasicField: vi.fn(),
    resetWizard: vi.fn(),
    goToNextStep: vi.fn(),
    updateIdentificationField: vi.fn(),
    setParticipantsText: vi.fn(),
    importParticipants: vi.fn(),
    updateParticipantField: vi.fn(),
    addParticipantRow: vi.fn(),
    removeParticipantRow: vi.fn(),
    goToPreviousStep: vi.fn(),
    updateSampleDraft: vi.fn(),
    updatePieceDraft: vi.fn(),
    selectSampleForEdit: vi.fn(),
    selectPieceForEdit: vi.fn(),
    saveSampleDraft: vi.fn(),
    savePieceDraft: vi.fn(),
    deleteSample: vi.fn(),
    deletePiece: vi.fn(),
    moveSample: vi.fn(),
    movePiece: vi.fn(),
    handlePieceFileSelected: vi.fn(),
    canContinueToOrganization: true,
    updateOrganizationField: vi.fn(),
    setOrganizationSampleId: vi.fn(),
    createExperimentRequest: vi.fn(),
  });

  beforeEach(() => {
    useCreateExperimentWizard.mockReturnValue(buildWizard());
  });

  it("renders step content", () => {
    render(
      <MemoryRouter>
        <NCreatePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/criar experimento/i)).toBeInTheDocument();
    expect(screen.getByText(/stepbasic/i)).toBeInTheDocument();
  });

  it("shows submission error when present", () => {
    useCreateExperimentWizard.mockReturnValueOnce({
      ...buildWizard(),
      submissionError: "Erro ao salvar",
    });

    render(
      <MemoryRouter>
        <NCreatePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/erro ao salvar/i)).toBeInTheDocument();
  });
});
