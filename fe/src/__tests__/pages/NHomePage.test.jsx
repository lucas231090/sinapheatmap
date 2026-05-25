import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NHomePage from "@/pages/researcher/NHomePage";
import { useNHomePage } from "@/hooks/useNHomePage";
import { useAuthStore } from "@/store/useAuthStore";

vi.mock("@/hooks/useNHomePage");
vi.mock("@/store/useAuthStore");

describe("NHomePage", async () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({
      user: { name: "Test Researcher" },
    });
  });

  it("renders loading state correctly", () => {
    useNHomePage.mockReturnValue({
      experiments: [],
      isLoading: true,
      error: null,
      handleDeleteClick: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      setExperimentToDelete: vi.fn(),
      experimentToDelete: null,
    });

    render(
      <MemoryRouter>
        <NHomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it("renders error state correctly", () => {
    useNHomePage.mockReturnValue({
      experiments: [],
      isLoading: false,
      error: "Error fetching experiments",
      handleDeleteClick: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      setExperimentToDelete: vi.fn(),
      experimentToDelete: null,
    });

    render(
      <MemoryRouter>
        <NHomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Error fetching experiments/i)).toBeInTheDocument();
  });

  it("renders experiments table when data is loaded", async () => {
    useNHomePage.mockReturnValue({
      experiments: [
        {
          id: "1",
          name: "Exp 1",
          isImported: false,
          active: true,
          startDate: "2023-01-01T00:00:00Z",
          endDate: "2023-01-02T00:00:00Z",
          participantsCount: 5,
        },
      ],
      isLoading: false,
      error: null,
      handleDeleteClick: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      setExperimentToDelete: vi.fn(),
      experimentToDelete: null,
    });

    render(
      <MemoryRouter>
        <NHomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/página inicial/i)).toBeInTheDocument();
      expect(screen.getByText(/Exp 1/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /importar teste/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /criar experimento/i })).toBeInTheDocument();
    });
  });
});
