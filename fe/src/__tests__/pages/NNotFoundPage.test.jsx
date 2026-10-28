import React from "react";
import { render, screen } from "@testing-library/react";
import NNotFoundPage from "@/pages/user/NNotFoundPage";

describe("NNotFoundPage", () => {
  it("renders not found message", () => {
    render(<NNotFoundPage />);
    expect(screen.getByText(/encontrada/i)).toBeInTheDocument();
  });
});
