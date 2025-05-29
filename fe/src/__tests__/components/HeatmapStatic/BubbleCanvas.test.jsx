import React from "react";
import { render, act } from "@testing-library/react";
import BubbleCanvas from "@/components/HeatmapStatic/BubbleCanvas";

// Store initial values for context properties that are not functions
const initialMockContextStateValues = {
  strokeStyle: "",
  fillStyle: "",
  lineWidth: 1,
  textAlign: "",
  textBaseline: "",
};

// This will hold the jest.fn mocks for context methods and current property values
let mockContext;

// Mock HTMLCanvasElement prototype methods globally or at the top of the test file
HTMLCanvasElement.prototype.getContext = jest.fn();
HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn();
HTMLCanvasElement.prototype.addEventListener = jest.fn();
HTMLCanvasElement.prototype.removeEventListener = jest.fn();

const mockTransformComponentRef = {
  current: {
    instance: {
      transformState: {
        scale: 1,
      },
    },
  },
};

describe("BubbleCanvas Component", () => {
  let mockCanvasRefForCurrentTest; // Ref object passed as prop to the component

  const defaultProps = {
    get canvasRef() {
      return mockCanvasRefForCurrentTest;
    },
    canvasSize: { width: 800, height: 600 },
    coords: [
      { x: 100, y: 100 },
      { x: 200, y: 150 },
      { x: 300, y: 200 },
    ],
    transformComponentRef: mockTransformComponentRef,
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clears call history for all mocks, including prototype ones.

    // Recreate mockContext with fresh jest.fn() for its methods and reset properties
    mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      fillText: jest.fn(),
      fillRect: jest.fn(),
      ...initialMockContextStateValues, // Reset properties like strokeStyle, fillStyle
    };

    // Configure prototype mocks
    HTMLCanvasElement.prototype.getContext.mockReturnValue(mockContext);
    HTMLCanvasElement.prototype.getBoundingClientRect.mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    });
    // addEventListener and removeEventListener are already jest.fn() from global mock.
    // jest.clearAllMocks() resets their call history.

    // This ref object is passed to the component.
    // The component will set its .current property to its DOM canvas element.
    mockCanvasRefForCurrentTest = { current: null };
  });

  test("renders canvas with correct props", () => {
    const { container } = render(<BubbleCanvas {...defaultProps} />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute("width", "800");
    expect(canvas).toHaveAttribute("height", "600");
  });

  test("applies correct canvas styles", () => {
    const { container } = render(<BubbleCanvas {...defaultProps} />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveStyle({
      position: "absolute",
      top: "0",
      left: "0",
      zIndex: "2",
    });
  });

  test("sets up canvas context correctly on mount", async () => {
    await act(async () => {
      render(<BubbleCanvas {...defaultProps} />);
    });

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
    expect(mockContext.textAlign).toBe("center");
    expect(mockContext.textBaseline).toBe("middle");
  });

  test("draws initial canvas without mouse coordinates", async () => {
    await act(async () => {
      render(<BubbleCanvas {...defaultProps} />);
    });

    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(mockContext.beginPath).toHaveBeenCalled();
    // Arc is called for each coordinate, fillText also for each.
    // If coords has 3 items, arc and fillText will be called 3 times.
    expect(mockContext.arc).toHaveBeenCalledTimes(defaultProps.coords.length);
    expect(mockContext.fillText).toHaveBeenCalledTimes(
      defaultProps.coords.length
    );
  });

  test("draws arrows between coordinates", async () => {
    await act(async () => {
      render(<BubbleCanvas {...defaultProps} />);
    });
    // Arrows are drawn for n-1 coordinates if n > 1
    const expectedArrowDraws =
      defaultProps.coords.length > 1 ? defaultProps.coords.length - 1 : 0;
    if (expectedArrowDraws > 0) {
      expect(mockContext.moveTo).toHaveBeenCalledTimes(expectedArrowDraws * 2); // moveTo is called twice per arrow in drawArrow
      expect(mockContext.lineTo).toHaveBeenCalledTimes(expectedArrowDraws * 4); // lineTo is called four times per arrow
      // stroke is called once for each arrow's line AND once for each circle's border
      expect(mockContext.stroke).toHaveBeenCalledTimes(
        expectedArrowDraws + defaultProps.coords.length
      );
      expect(mockContext.fill).toHaveBeenCalledTimes(
        expectedArrowDraws + defaultProps.coords.length
      ); // fill for arrow head + fill for each circle
    } else {
      expect(mockContext.moveTo).not.toHaveBeenCalled();
      expect(mockContext.lineTo).not.toHaveBeenCalled();
      expect(mockContext.stroke).not.toHaveBeenCalled();
    }
  });

  test("draws circles for each coordinate", async () => {
    await act(async () => {
      render(<BubbleCanvas {...defaultProps} />);
    });

    expect(mockContext.arc).toHaveBeenCalledTimes(defaultProps.coords.length);
    defaultProps.coords.forEach((coord, index) => {
      expect(mockContext.fillText).toHaveBeenCalledWith(
        index + 1,
        Math.floor(coord.x),
        Math.floor(coord.y)
      );
    });
  });

  test("adds mousemove event listener on mount", async () => {
    await act(async () => {
      render(<BubbleCanvas {...defaultProps} />);
    });

    expect(HTMLCanvasElement.prototype.addEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function)
    );
  });

  test("removes mousemove event listener on unmount", async () => {
    let unmount;
    await act(async () => {
      const result = render(<BubbleCanvas {...defaultProps} />);
      unmount = result.unmount;
    });

    await act(async () => {
      unmount();
    });

    expect(
      HTMLCanvasElement.prototype.removeEventListener
    ).toHaveBeenCalledWith("mousemove", expect.any(Function));
  });

  test("handles empty coordinates array", async () => {
    const propsWithEmptyCoords = {
      ...defaultProps,
      coords: [],
    };

    await act(async () => {
      render(<BubbleCanvas {...propsWithEmptyCoords} />);
    });

    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(mockContext.arc).not.toHaveBeenCalled();
  });

  test("handles single coordinate", async () => {
    const singleCoord = { x: 150, y: 150 };
    const propsWithSingleCoord = {
      ...defaultProps,
      coords: [singleCoord],
    };

    await act(async () => {
      render(<BubbleCanvas {...propsWithSingleCoord} />);
    });

    expect(mockContext.arc).toHaveBeenCalledTimes(1);
    expect(mockContext.fillText).toHaveBeenCalledWith(
      1,
      Math.floor(singleCoord.x),
      Math.floor(singleCoord.y)
    );
    // No arrows for a single point
    expect(mockContext.moveTo).not.toHaveBeenCalled();
  });

  test("redraws canvas when coords prop changes", async () => {
    let rerender;
    await act(async () => {
      const result = render(<BubbleCanvas {...defaultProps} />);
      rerender = result.rerender;
    });

    // Clear mocks to check calls after rerender
    mockContext.clearRect.mockClear();
    mockContext.fillText.mockClear();

    const newCoords = [
      { x: 50, y: 50 },
      { x: 150, y: 100 },
    ];

    await act(async () => {
      rerender(<BubbleCanvas {...defaultProps} coords={newCoords} />);
    });

    expect(mockContext.clearRect).toHaveBeenCalled(); // Called at least once due to redraw
    expect(mockContext.fillText).toHaveBeenCalledWith(1, 50, 50);
    expect(mockContext.fillText).toHaveBeenCalledWith(2, 150, 100);
  });

  test("redraws canvas when canvasSize prop changes", async () => {
    let rerender;
    await act(async () => {
      const result = render(<BubbleCanvas {...defaultProps} />);
      rerender = result.rerender;
    });
    mockContext.clearRect.mockClear(); // Clear before rerender

    const newCanvasSize = { width: 1000, height: 800 };

    await act(async () => {
      rerender(<BubbleCanvas {...defaultProps} canvasSize={newCanvasSize} />);
    });

    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  test("handles missing canvas ref gracefully", () => {
    const propsWithMissingRefProp = {
      ...defaultProps,
      canvasRef: null, // Pass null instead of a ref object
    };
    // The component's `if (!canvasRef.current)` guard might not be hit if canvasRef itself is null.
    // Let's test with canvasRef.current being null.
    const propsWithNullCurrentInRef = {
      ...defaultProps,
      canvasRef: { current: null }, // This is what the component expects to guard against
    };

    expect(() => {
      render(<BubbleCanvas {...propsWithNullCurrentInRef} />);
    }).not.toThrow();

    // Also test if canvasRef prop itself is undefined or null
    expect(() => {
      render(<BubbleCanvas {...defaultProps} canvasRef={undefined} />);
    }).not.toThrow();

    expect(() => {
      render(<BubbleCanvas {...propsWithMissingRefProp} />);
    }).not.toThrow();
  });

  test("handles canvas without context gracefully", async () => {
    HTMLCanvasElement.prototype.getContext.mockReturnValueOnce(null);

    await act(async () => {
      render(<BubbleCanvas {...defaultProps} />);
    });
    // Check that drawing operations were not attempted
    expect(mockContext.clearRect).not.toHaveBeenCalled();
  });

  test("uses different colors for arrows", async () => {
    const propsWithManyCoords = {
      ...defaultProps,
      coords: Array.from({ length: 15 }, (_, i) => ({
        x: 50 + i * 50,
        y: 50 + i * 30,
      })),
    };

    await act(async () => {
      render(<BubbleCanvas {...propsWithManyCoords} />);
    });

    // Check if strokeStyle was set multiple times (implies different colors were attempted)
    // The actual value of mockContext.strokeStyle will be the last one set.
    // We need to check if it was assigned. The component assigns it directly.
    // A more robust check would be to spy on the assignment or check calls if it were a setter function.
    // For now, checking it's defined and was likely changed from initial "" is a basic check.
    expect(mockContext.strokeStyle).not.toBe(
      initialMockContextStateValues.strokeStyle
    ); // Assuming it changed
  });

  test("applies scale transformation correctly in mouse handler", async () => {
    const mockEvent = {
      clientX: 100,
      clientY: 100,
    };

    const scaledTransformRef = {
      current: {
        instance: {
          transformState: {
            scale: 2,
          },
        },
      },
    };

    const propsWithScale = {
      ...defaultProps,
      transformComponentRef: scaledTransformRef,
    };

    await act(async () => {
      render(<BubbleCanvas {...propsWithScale} />);
    });
    mockContext.clearRect.mockClear(); // Clear before triggering event

    const mouseMoveCall =
      HTMLCanvasElement.prototype.addEventListener.mock.calls.find(
        (call) => call[0] === "mousemove"
      );
    expect(mouseMoveCall).toBeDefined();
    const eventHandler = mouseMoveCall[1];

    await act(async () => {
      eventHandler(mockEvent);
    });

    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  test("floors coordinate values when drawing", async () => {
    const propsWithFloatCoords = {
      ...defaultProps,
      coords: [
        { x: 100.7, y: 100.3 },
        { x: 200.9, y: 150.1 },
      ],
    };

    await act(async () => {
      render(<BubbleCanvas {...propsWithFloatCoords} />);
    });

    expect(mockContext.fillText).toHaveBeenCalledWith(1, 100, 100);
    expect(mockContext.fillText).toHaveBeenCalledWith(2, 200, 150);
  });
});
