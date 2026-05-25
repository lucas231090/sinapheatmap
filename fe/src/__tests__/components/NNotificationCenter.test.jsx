import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NNotificationCenter from "@/components/notifications/NNotificationCenter";
import { useNotificationStore } from "@/store/useNotificationStore";

vi.mock("@/store/useNotificationStore");

describe("NNotificationCenter", async () => {
  it("renders nothing when there are no notifications", () => {
    useNotificationStore.mockImplementation((selector) =>
      selector({ notifications: [], removeNotification: vi.fn() }),
    );

    const { container } = render(<NNotificationCenter />);
    expect(container.firstChild).toBeNull();
  });

  it("renders notifications and handles removal", () => {
    const removeNotification = vi.fn();
    useNotificationStore.mockImplementation((selector) =>
      selector({
        notifications: [{ id: "1", type: "success", message: "Tudo certo" }],
        removeNotification,
      }),
    );

    render(<NNotificationCenter />);

    expect(screen.getByText(/tudo certo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/fechar notificacao/i));
    expect(removeNotification).toHaveBeenCalledWith("1");
  });
});
