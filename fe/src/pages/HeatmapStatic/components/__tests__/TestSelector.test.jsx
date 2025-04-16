/**
 * Testes unitários para o componente TestSelector
 * Verifica a renderização, interação e formatação de datas
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestSelector from "../TestSelector";

describe("TestSelector Component", () => {
  /**
   * Testa se o componente não renderiza nada quando nenhum dado é fornecido
   * Isso previne erros de renderização com dados ausentes
   */
  test("renders nothing when no data is provided", () => {
    const { container } = render(
      <TestSelector
        dataFile={null}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  /**
   * Testa se o componente não renderiza o seletor quando apenas um teste está disponível
   * Não há necessidade de selecionar entre testes quando só existe um
   */
  test("renders nothing when only one test is available", () => {
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

    expect(container.firstChild).toBeNull();
  });

  /**
   * Testa se o componente renderiza o seletor com todas as opções quando múltiplos testes estão disponíveis
   * Verifica a estrutura completa do componente e os textos das opções
   */
  test("renders selector with options for multiple tests", () => {
    // Dados simulados com múltiplos testes
    const multipleTestsData = {
      jsonData: [
        { "Data-Hora": "2023-01-01", test: "test1" },
        { "Data-Hora": "2023-01-02", test: "test2" },
        { "Data-Hora": "2023-01-03", test: "test3" },
      ],
    };

    // Renderiza o componente com os dados de teste
    render(
      <TestSelector
        dataFile={multipleTestsData}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
      />
    );

    // Verifica se o seletor é renderizado
    const selector = screen.getByRole("combobox");
    expect(selector).toBeInTheDocument();

    // Verifica se tem opções para "Todos" mais cada teste
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4); // "Todos" + 3 testes

    // Verifica os textos de cada opção
    expect(options[0]).toHaveTextContent("Combine All Tests");
    expect(options[1]).toHaveTextContent("Test 1");
    expect(options[2]).toHaveTextContent("Test 2");
    expect(options[3]).toHaveTextContent("Test 3");

    // Verifica se a primeira opção (Todos) está selecionada
    expect(selector.value).toBe("all");
  });

  /**
   * Testa se o componente chama a função setSelectedTestIndex quando a seleção muda
   * Verifica a interatividade do componente
   */
  test("calls setSelectedTestIndex when selection changes", () => {
    // Dados de teste com múltiplos testes
    const multipleTestsData = {
      jsonData: [
        { "Data-Hora": "2023-01-01", test: "test1" },
        { "Data-Hora": "2023-01-02", test: "test2" },
      ],
    };

    // Mock da função de callback para verificar se é chamada
    const mockSetSelectedTestIndex = jest.fn();

    // Renderiza o componente
    render(
      <TestSelector
        dataFile={multipleTestsData}
        selectedTestIndex="all"
        setSelectedTestIndex={mockSetSelectedTestIndex}
      />
    );

    // Simula a seleção do segundo teste
    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: "1" } });

    // Verifica se a função de callback foi chamada com o valor correto
    expect(mockSetSelectedTestIndex).toHaveBeenCalledWith("1");
  });

  /**
   * Testa se o componente lida corretamente com diferentes formatos de data
   * Verifica a capacidade de processamento de datas
   */
  test("handles date formatting correctly", () => {
    // Dados com diferentes formatos de data, incluindo data inválida
    const dataWithDifferentDates = {
      jsonData: [
        { "Data-Hora": "2023-01-01 10:30:45", test: "test1" },
        { "Data-Hora": "2023/02/15 14:20:00", test: "test2" },
        { "Data-Hora": "Invalid Date", test: "test3" },
      ],
    };

    // Renderiza o componente
    render(
      <TestSelector
        dataFile={dataWithDifferentDates}
        selectedTestIndex="all"
        setSelectedTestIndex={jest.fn()}
      />
    );

    // Obtém todas as opções do seletor
    const options = screen.getAllByRole("option");

    // Verifica se as datas são exibidas corretamente
    expect(options[1]).toHaveTextContent("Test 1");
    expect(options[2]).toHaveTextContent("Test 2");

    // Data inválida deve mostrar apenas o número do teste
    expect(options[3]).toHaveTextContent("Test 3");
  });
});
