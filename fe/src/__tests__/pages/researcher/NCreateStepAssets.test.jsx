import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NCreateStepAssets from "@/pages/researcher/NCreatePage/components/NCreateStepAssets";

describe("NCreateStepAssets", () => {
  it("renders samples and handles save", () => {
    const onSampleSave = vi.fn();

    render(
      <NCreateStepAssets
        samples={[{ id: "s1", name: "Amostra", description: "" }]}
        pieces={[]}
        sampleDraft={{ name: "", description: "" }}
        pieceDraft={{
          sampleId: "s1",
          sourceType: "file",
          sourceLabel: "",
          fileName: "",
          previewKind: "image",
          exposureSeconds: "",
          sourceUrl: "",
        }}
        selectedSampleId="s1"
        selectedPieceId=""
        fileInputRef={{ current: null }}
        onSampleDraftChange={vi.fn()}
        onPieceDraftChange={vi.fn()}
        onSampleSelect={vi.fn()}
        onPieceSelect={vi.fn()}
        onSampleSave={onSampleSave}
        onSampleCreateNew={vi.fn()}
        onPieceSave={vi.fn()}
        onPieceCreateNew={vi.fn()}
        onSampleDelete={vi.fn()}
        onPieceDelete={vi.fn()}
        onSampleMove={vi.fn()}
        onPieceMove={vi.fn()}
        onFileUploadClick={vi.fn()}
        onFileSelected={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onReset={vi.fn()}
        canAdvance={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /salvar amostra/i }));
    expect(onSampleSave).toHaveBeenCalled();
  });
});
