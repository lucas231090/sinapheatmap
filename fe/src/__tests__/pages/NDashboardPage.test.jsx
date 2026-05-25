import React from "react";
import { render, screen } from "@testing-library/react";
import NDashboardPage from "@/pages/admin/NDashboardPage";

describe("NDashboardPage", () => {
  it("renders dashboard title", () => {
    render(<NDashboardPage />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
