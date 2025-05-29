/**
 * Testes unitários para o componente TestSelector
 * Verifica a renderização e interação com o seletor de testes de heatmap
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestSelector from "@/components/Heatmap/TestSelector";

describe("TestSelector Component", () => {
  it("renders nothing when no data is provided", () => {
    const { container } = render(
      <TestSelector
        dataFile={null}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
      />
    );

    // Verifica se o componente não renderizou nada
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when only one test is available", () => {
    const singleTestData = {
      jsonData: [{ test: "data" }],
    };

    const { container } = render(
      <TestSelector
        dataFile={singleTestData}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
      />
    );

    // Verifica se o componente não renderizou nada
    expect(container.firstChild).toBeNull();
  });

  it("renders selector with options for multiple tests", () => {
    // Dados simulados com múltiplos testes
    const multipleTestsData = {
      jsonData: [{ test: "test1" }, { test: "test2" }, { test: "test3" }],
    };

    // Renderiza o componente
    render(
      <TestSelector
        dataFile={multipleTestsData}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
      />
    );

    // Verifica se o seletor foi renderizado
    const selector = screen.getByRole("combobox");
    expect(selector).toBeInTheDocument();

    // Verifica se tem opções para "Selecione", "Combine All Tests" e cada teste
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(5); // Default + "all" + 3 testes

    // Verifica os textos das opções
    expect(options[0]).toHaveTextContent("-- Selecione um teste --");
    expect(options[1]).toHaveTextContent("Combine All Tests");
    expect(options[2]).toHaveTextContent("Test 1");
    expect(options[3]).toHaveTextContent("Test 2");
    expect(options[4]).toHaveTextContent("Test 3");

    // Verifica se "all" está selecionado
    expect(selector.value).toBe("all");
  });

  it("calls setSelectedTestIndex when selection changes", () => {
    // Dados de teste
    const multipleTestsData = {
      jsonData: [{ test: "test1" }, { test: "test2" }],
    };

    // Mock da função de callback
    const mockSetSelectedTestIndex = jest.fn();

    // Renderiza o componente
    render(
      <TestSelector
        dataFile={multipleTestsData}
        selectedTestIndex="all"
        setSelectedTestIndex={mockSetSelectedTestIndex}
      />
    );

    // Simula a mudança de valor
    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: "1" } });

    // Verifica se a função foi chamada com o valor correto
    expect(mockSetSelectedTestIndex).toHaveBeenCalledWith("1");
  });

  it("should be disabled when disabled prop is true", () => {
    // Dados de teste
    const multipleTestsData = {
      jsonData: [{ test: "test1" }, { test: "test2" }],
    };

    // Renderiza o componente com disabled=true
    render(
      <TestSelector
        dataFile={multipleTestsData}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
        disabled={true}
      />
    );

    // Verifica se o seletor está desabilitado
    const selector = screen.getByRole("combobox");
    expect(selector).toBeDisabled();

    // Verifica se a classe CSS de desabilitado está aplicada
    expect(selector).toHaveClass("opacity-70");
    expect(selector).toHaveClass("cursor-not-allowed");
  });
});
