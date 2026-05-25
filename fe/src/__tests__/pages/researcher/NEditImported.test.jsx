import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NEditImported from "@/pages/researcher/NEditPage/NEditImported";
import { useNotifications } from "@/hooks/useNotifications";

vi.mock("@/hooks/useNotifications");

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("NEditImported", () => {
  it("renders form fields", () => {
    useNotifications.mockReturnValue({
      notifyError: vi.fn(),
      notifySuccess: vi.fn(),
    });

    render(
      <MemoryRouter>
        <NEditImported
          experiment={{
            basic: { name: "Teste", description: "Desc" },
            pieces: [
              {
                mediaUrl: "",
                previewKind: "image",
              },
            ],
          }}
          onCancel={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/nome do experimento/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /salvar altera..es/i }),
    ).toBeInTheDocument();
  });
});
