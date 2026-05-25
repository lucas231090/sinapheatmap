import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NCreateStepOrganization from "@/pages/researcher/NCreatePage/components/NCreateStepOrganization";

describe("NCreateStepOrganization", () => {
  it("renders controls and submits", () => {
    const onNext = vi.fn();

    render(
      <NCreateStepOrganization
        samples={[{ id: "s1", name: "Amostra" }]}
        pieces={[{ id: "p1", sampleId: "s1", sourceType: "file" }]}
        organization={{ randomizeSamples: false, randomizePieces: false }}
        selectedOrganizationSampleId="s1"
        onOrganizationFieldChange={vi.fn()}
        onSelectOrganizationSample={vi.fn()}
        onSampleMove={vi.fn()}
        onPieceMove={vi.fn()}
        onPrevious={vi.fn()}
        onNext={onNext}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /criar/i }));
    expect(onNext).toHaveBeenCalled();
  });
});
