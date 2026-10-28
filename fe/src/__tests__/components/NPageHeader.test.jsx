import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NPageHeader from "@/components/general/NPageHeader";

describe("NPageHeader", () => {
  it("renders title, description and back action", () => {
    render(
      <MemoryRouter>
        <NPageHeader
          title="Titulo"
          description="Descricao"
          backHref="/home"
          backLabel="Voltar"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /titulo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/descricao/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voltar/i })).toBeInTheDocument();
  });
});
