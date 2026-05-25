import React from "react";
import { render, screen } from "@testing-library/react";
import NCreateWizardStepper from "@/pages/researcher/NCreatePage/components/NCreateWizardStepper";

describe("NCreateWizardStepper", () => {
  it("renders steps and highlights active step", () => {
    render(
      <NCreateWizardStepper activeStep={2} labels={["Um", "Dois", "Tres"]} />,
    );

    expect(screen.getByText(/um/i)).toBeInTheDocument();
    expect(screen.getByText(/dois/i)).toBeInTheDocument();
    expect(screen.getByText(/tres/i)).toBeInTheDocument();
  });
});
