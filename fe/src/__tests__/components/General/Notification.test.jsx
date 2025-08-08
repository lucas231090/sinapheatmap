import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Notification from "../../../components/General/Notification";

describe("Notification Component", () => {
  test("renders nothing when message is empty", () => {
    const { container } = render(
      <Notification message="" type="success" onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders success notification with correct styling", () => {
    const onCloseMock = jest.fn();

    render(
      <Notification
        message="Operation successful"
        type="success"
        onClose={onCloseMock}
      />
    );

    // Check if message is displayed
    const notification = screen.getByText("Operation successful");
    expect(notification).toBeInTheDocument();

    // Check if notification has correct background color
    const notificationContainer = notification.parentElement;
    expect(notificationContainer).toHaveClass("bg-green-500");

    // Test close button
    const closeButton = screen.getByText("Fechar");
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test("renders error notification with correct styling", () => {
    render(
      <Notification message="Error occurred" type="error" onClose={() => {}} />
    );

    // Check if message is displayed
    const notification = screen.getByText("Error occurred");
    expect(notification).toBeInTheDocument();

    // Check if notification has correct background color
    const notificationContainer = notification.parentElement;
    expect(notificationContainer).toHaveClass("bg-red-500");
  });

  test("renders info notification with correct styling", () => {
    render(
      <Notification
        message="Information notice"
        type="info"
        onClose={() => {}}
      />
    );

    // Check if message is displayed
    const notification = screen.getByText("Information notice");
    expect(notification).toBeInTheDocument();

    // Check if notification has correct background color
    // Nota: O tipo "info" atualmente usa bg-gray-500 em vez de bg-blue-500
    const notificationContainer = notification.parentElement;
    expect(notificationContainer).toHaveClass("bg-gray-500");
  });

  test("renders warning notification with correct styling", () => {
    render(
      <Notification
        message="Warning notice"
        type="warning"
        onClose={() => {}}
      />
    );

    // Check if message is displayed
    const notification = screen.getByText("Warning notice");
    expect(notification).toBeInTheDocument();

    // Check if notification has correct background color
    const notificationContainer = notification.parentElement;
    expect(notificationContainer).toHaveClass("bg-yellow-500");
  });

  test("renders with default styling for unknown type", () => {
    render(
      <Notification
        message="Unknown type notification"
        type="unknown"
        onClose={() => {}}
      />
    );

    // Check if message is displayed
    const notification = screen.getByText("Unknown type notification");
    expect(notification).toBeInTheDocument();

    // Check if notification has default background color
    const notificationContainer = notification.parentElement;
    expect(notificationContainer).toHaveClass("bg-gray-500");
  });
});
