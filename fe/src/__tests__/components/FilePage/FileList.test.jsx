import React from "react";
import { render, screen } from "@testing-library/react";
import FileList from "@/components/FilePage/FileList";
import { useFileContext } from "@/context/FileContext";

// Mock TestCard component
jest.mock("@/components/FilePage/TestCard/TestCard", () => {
  return function TestCard({ file, callFunction, index }) {
    return (
      <div data-testid={`test-card-${index}`}>
        <span data-testid="file-name">{file.filename}</span>
        <button data-testid="file-action" onClick={() => callFunction(file)}>
          Open File
        </button>
      </div>
    );
  };
});

// Mock FileContext
jest.mock("@/context/FileContext", () => ({
  useFileContext: jest.fn(),
}));

describe("FileList Component", () => {
  const mockAbrirModal = jest.fn();
  const mockFiles = [
    {
      id: 1,
      filename: "test-file-1.json",
      description: "Test file 1 description",
      createdAt: "2024-01-01",
    },
    {
      id: 2,
      filename: "test-file-2.json",
      description: "Test file 2 description",
      createdAt: "2024-01-02",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useFileContext.mockReturnValue({
      files: mockFiles,
      fetchData: jest.fn(),
      showNotification: jest.fn(),
    });
  });

  test("renders the component title correctly", () => {
    render(<FileList getFiles={mockFiles} abrirModal={mockAbrirModal} />);

    const title = screen.getByText("Escolha um Arquivo");
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass(
      "text-title",
      "dark:text-darktitle",
      "text-lg",
      "font-bold",
      "mb-4"
    );
  });

  test("renders TestCard components when files are provided", () => {
    render(<FileList getFiles={mockFiles} abrirModal={mockAbrirModal} />);

    const testCards = screen.getAllByTestId(/test-card-/);
    expect(testCards).toHaveLength(2);

    expect(screen.getByTestId("test-card-0")).toBeInTheDocument();
    expect(screen.getByTestId("test-card-1")).toBeInTheDocument();
  });

  test("displays file names correctly in TestCards", () => {
    render(<FileList getFiles={mockFiles} abrirModal={mockAbrirModal} />);

    const fileNames = screen.getAllByTestId("file-name");
    expect(fileNames[0]).toHaveTextContent("test-file-1.json");
    expect(fileNames[1]).toHaveTextContent("test-file-2.json");
  });

  test("calls abrirModal when TestCard action is triggered", () => {
    render(<FileList getFiles={mockFiles} abrirModal={mockAbrirModal} />);

    const firstFileAction = screen.getAllByTestId("file-action")[0];
    firstFileAction.click();

    expect(mockAbrirModal).toHaveBeenCalledWith(mockFiles[0]);
    expect(mockAbrirModal).toHaveBeenCalledTimes(1);
  });

  test("displays 'Nenhum Teste Achado' message when no files are provided", () => {
    render(<FileList getFiles={[]} abrirModal={mockAbrirModal} />);

    const noFilesMessage = screen.getByText("Nenhum Teste Achado");
    expect(noFilesMessage).toBeInTheDocument();
    expect(noFilesMessage).toHaveClass(
      "text-smallertext",
      "dark:text-darksmallertext",
      "text-center"
    );
  });

  test("applies correct CSS classes to the main container", () => {
    const { container } = render(
      <FileList getFiles={mockFiles} abrirModal={mockAbrirModal} />
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass(
      "bg-card",
      "dark:bg-darkcard",
      "p-4",
      "rounded-lg",
      "shadow",
      "min-h-full",
      "h-130"
    );
  });

  test("applies correct CSS classes to the scrollable container", () => {
    const { container } = render(
      <FileList getFiles={mockFiles} abrirModal={mockAbrirModal} />
    );

    const scrollableContainer = container.querySelector(
      ".flex.flex-col.gap-3.overflow-y-auto.h-full.max-h-110"
    );
    expect(scrollableContainer).toHaveClass(
      "flex",
      "flex-col",
      "gap-3",
      "overflow-y-auto",
      "h-full",
      "max-h-110"
    );
  });

  test("renders correct number of file cards with proper structure", () => {
    const manyFiles = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      filename: `test-file-${index + 1}.json`,
      description: `Description ${index + 1}`,
    }));

    render(<FileList getFiles={manyFiles} abrirModal={mockAbrirModal} />);

    const testCards = screen.getAllByTestId(/test-card-/);
    expect(testCards).toHaveLength(5);

    // Check that each card is wrapped in a div with padding
    testCards.forEach((card, index) => {
      expect(card.parentElement).toHaveClass("px-4");
    });
  });

  test("handles empty filename gracefully", () => {
    const filesWithEmptyName = [
      {
        id: 1,
        filename: "",
        description: "File with empty name",
      },
    ];

    render(
      <FileList getFiles={filesWithEmptyName} abrirModal={mockAbrirModal} />
    );

    const fileName = screen.getByTestId("file-name");
    expect(fileName).toHaveTextContent("");
  });

  test("preserves file object structure when passing to abrirModal", () => {
    const complexFile = {
      id: 1,
      filename: "complex-file.json",
      description: "Complex file description",
      metadata: { size: 1024, type: "json" },
      createdAt: "2024-01-01T10:00:00Z",
    };

    render(<FileList getFiles={[complexFile]} abrirModal={mockAbrirModal} />);

    const fileAction = screen.getByTestId("file-action");
    fileAction.click();

    expect(mockAbrirModal).toHaveBeenCalledWith(complexFile);
  });
});
