import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NImportPage from "@/pages/researcher/NImportPage";
import { useNotifications } from "@/hooks/useNotifications";
import { importHeatmap } from "@/services/eyetrackingService";
import {
  buildImportedSessionsFromCsv,
  fileToDataUrl,
} from "@/utils/importExperiment";

vi.mock("@/hooks/useNotifications");
vi.mock("@/services/eyetrackingService");
vi.mock("@/utils/importExperiment", async () => ({
  buildImportedSessionsFromCsv: vi.fn(() => []),
  fileToDataUrl: vi.fn(() => Promise.resolve("data:image/png;base64,aaa")),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NImportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotifications.mockReturnValue({
      notifyError: vi.fn(),
      notifySuccess: vi.fn(),
    });
  });

  it("shows validation message when required fields are missing", () => {
    render(
      <MemoryRouter>
        <NImportPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /importar experimento/i }),
    );

    expect(
      screen.getByText(/Informe o nome do experimento/i),
    ).toBeInTheDocument();
  });

  it("submits data and redirects on success", async () => {
    const notifySuccess = vi.fn();
    useNotifications.mockReturnValue({
      notifyError: vi.fn(),
      notifySuccess,
    });

    importHeatmap.mockResolvedValueOnce({ data: { data: { _id: "123" } } });

    render(
      <MemoryRouter>
        <NImportPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Ex\.: Heatmap da leitura/i), {
      target: { value: "Teste importado" },
    });

    const csvFile = new File(["x,y\n1,2"], "data.csv", {
      type: "text/csv",
    });
    Object.defineProperty(csvFile, "text", {
      value: vi.fn().mockResolvedValue("x,y\n1,2"),
    });

    const mediaFile = new File(["dummy"], "image.png", {
      type: "image/png",
    });

    fireEvent.change(screen.getByLabelText(/Arquivo CSV/i), {
      target: { files: [csvFile] },
    });
    fireEvent.change(screen.getByLabelText(/Imagem/i), {
      target: { files: [mediaFile] },
    });

    await waitFor(() => {
      expect(buildImportedSessionsFromCsv).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /importar experimento/i }),
    );

    await waitFor(() => {
      expect(importHeatmap).toHaveBeenCalled();
      expect(notifySuccess).toHaveBeenCalledWith(
        "Experimento importado com sucesso.",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/heatmap/123");
    });

    expect(fileToDataUrl).toHaveBeenCalled();
  });
});
