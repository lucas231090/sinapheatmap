import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NEditPage from "@/pages/researcher/NEditPage";
import { useEditExperimentWizard } from "@/hooks/useEditExperimentWizard";

vi.mock("@/hooks/useEditExperimentWizard");

vi.mock("@/pages/researcher/NEditPage/NEditImported", async () => ({ default: () => (
  <div>NEditImported</div>
) }));

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

describe("NEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    useEditExperimentWizard.mockReturnValue({
      isLoading: true,
      loadError: "",
    });

    render(
      <MemoryRouter>
        <NEditPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/carregando dados do experimento/i),
    ).toBeInTheDocument();
  });

  it("renders error state", () => {
    useEditExperimentWizard.mockReturnValue({
      isLoading: false,
      loadError: "Falhou",
    });

    render(
      <MemoryRouter>
        <NEditPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/falhou/i)).toBeInTheDocument();
  });

  it("renders imported edit flow", () => {
    useEditExperimentWizard.mockReturnValue({
      isLoading: false,
      loadError: "",
      experiment: { basic: { isImported: true } },
    });

    render(
      <MemoryRouter>
        <NEditPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/neditimported/i)).toBeInTheDocument();
  });

  it("renders wizard flow for non-imported", () => {
    useEditExperimentWizard.mockReturnValue({
      isLoading: false,
      loadError: "",
      experiment: {
        basic: { isImported: false },
        identification: {},
        participants: [],
        samples: [],
        pieces: [],
        organization: {},
      },
      activeStep: 1,
      submissionError: "",
      participantsText: "",
      sampleDraft: {},
      pieceDraft: {},
      selectedSampleId: "",
      selectedPieceId: "",
      fileInputRef: { current: null },
      organizationSampleId: "",
      updateBasicField: vi.fn(),
      resetToLoaded: vi.fn(),
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
      saveExperimentRequest: vi.fn(),
      isSubmitting: false,
    });

    render(
      <MemoryRouter>
        <NEditPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/stepbasic/i)).toBeInTheDocument();
  });
});
