import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NCreateStepIdentification from "@/pages/researcher/NCreatePage/components/NCreateStepIdentification";

describe("NCreateStepIdentification", () => {
  it("renders optional demographic settings", () => {
    const onParticipantDataChange = vi.fn();

    render(
      <NCreateStepIdentification
        participantData={{ collectAge: false, collectGender: false }}
        onParticipantDataChange={onParticipantDataChange}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText(/dados demograficos opcionais/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/perguntar a idade/i));
    expect(onParticipantDataChange).toHaveBeenCalledWith("collectAge", true);
  });
});
