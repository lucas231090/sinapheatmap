import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NCreateStepIdentification from "@/pages/researcher/NCreatePage/components/NCreateStepIdentification";

describe("NCreateStepIdentification", () => {
  it("renders participants list and triggers import", () => {
    const onImportParticipants = vi.fn();

    render(
      <NCreateStepIdentification
        identification={{ required: false, mode: "nome" }}
        participants={[{ id: "1", name: "Ana", cpf: "" }]}
        participantsText=""
        onIdentificationChange={vi.fn()}
        onParticipantsTextChange={vi.fn()}
        onImportParticipants={onImportParticipants}
        onParticipantChange={vi.fn()}
        onAddParticipantRow={vi.fn()}
        onRemoveParticipantRow={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText(/tabela din.mica/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /importar lista/i }));
    expect(onImportParticipants).toHaveBeenCalled();
  });
});
