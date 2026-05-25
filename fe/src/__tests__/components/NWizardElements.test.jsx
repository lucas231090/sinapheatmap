import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ActionButton,
  InputField,
  TextAreaField,
  SectionTitle,
  CardPanel,
  RowCard,
} from "@/components/general/NWizardElements";

describe("NWizardElements", () => {
  it("renders ActionButton and handles click", () => {
    const onClick = vi.fn();
    render(<ActionButton onClick={onClick}>Salvar</ActionButton>);
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders InputField and TextAreaField", () => {
    render(
      <div>
        <InputField label="Nome" />
        <TextAreaField label="Descricao" />
      </div>,
    );

    expect(screen.getByText(/nome/i)).toBeInTheDocument();
    expect(screen.getByText(/descricao/i)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
  });

  it("renders SectionTitle and CardPanel", () => {
    render(
      <CardPanel>
        <SectionTitle kicker="Kicker" title="Titulo" description="Descricao" />
      </CardPanel>,
    );

    expect(screen.getByText(/kicker/i)).toBeInTheDocument();
    expect(screen.getByText(/titulo/i)).toBeInTheDocument();
    expect(screen.getByText(/descricao/i)).toBeInTheDocument();
  });

  it("triggers RowCard handlers", () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(
      <RowCard
        title="Item"
        subtitle="Sub"
        onClick={onClick}
        onDelete={onDelete}
        onMoveLeft={vi.fn()}
        onMoveRight={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Item"));
    expect(onClick).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(/remover item/i));
    expect(onDelete).toHaveBeenCalled();
  });
});
