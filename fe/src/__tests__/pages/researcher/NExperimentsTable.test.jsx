import { MemoryRouter } from 'react-router-dom';
import React from "react";
import { render, screen } from "@testing-library/react";
import NExperimentsTable from "@/pages/researcher/NHomePage/components/NExperimentsTable";
import { updateExperimentStatus } from "@/services/eyetrackingService";

vi.mock("@/services/eyetrackingService", async () => ({
  updateExperimentStatus: vi.fn(() => Promise.resolve()),
}));

describe("NExperimentsTable", () => {
  it("renders experiment rows", () => {
    render(
      <MemoryRouter><NExperimentsTable
        experiments={[
          {
            id: "1",
            name: "Teste",
            description: "Desc",
            startDate: "",
            endDate: "",
            participantsCount: 2,
            active: true,
            isImported: false,
          },
        ]}
        isLoading={false}
        error={null}
        onRefresh={vi.fn()}
      /></MemoryRouter>,
    );

    expect(screen.getByText(/tabela de experimentos/i)).toBeInTheDocument();
    expect(screen.getByText("Teste")).toBeInTheDocument();
    expect(updateExperimentStatus).not.toHaveBeenCalled();
  });
});
