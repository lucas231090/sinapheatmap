import { createHoverStore, hitTestCircles } from "@/components/heatmap/hover/hoverStore";

const makeSurface = (rect) => ({ getBoundingClientRect: () => rect });

describe("hitTestCircles", () => {
  const items = [
    { x: 50, y: 50 },
    { x: 60, y: 50 },
  ];

  it("prefers the top-most circle containing the point", () => {
    expect(hitTestCircles(items, () => 15, 58, 50, 1)).toBe(0);
  });

  it("falls back to the nearest circle within the pixel tolerance", () => {
    expect(hitTestCircles(items, () => 5, 69, 50, 1)).toBe(1);
    expect(hitTestCircles(items, () => 5, 90, 50, 1)).toBeNull();
  });
});

describe("createHoverStore", () => {
  it("maps client coordinates through the zoom transform", () => {
    const store = createHoverStore();
    // Canvas 200x100 rendered at 2x zoom, offset by (100, 50) on screen.
    store.setSurface(
      makeSurface({ left: 100, top: 50, width: 400, height: 200 }),
      { width: 200, height: 100 },
    );
    const hitTest = vi.fn(() => null);
    store.registerLayer("a", { priority: 1, hitTest });

    store.pointerMove(300, 150);
    expect(hitTest).toHaveBeenLastCalledWith(100, 50, 0.5);
  });

  it("gives priority to the highest-priority layer that hits", () => {
    const store = createHoverStore();
    store.setSurface(makeSurface({ left: 0, top: 0, width: 10, height: 10 }), {
      width: 10,
      height: 10,
    });
    store.registerLayer("low", { priority: 1, hitTest: () => 3 });
    const unregisterHigh = store.registerLayer("high", {
      priority: 2,
      hitTest: () => 7,
    });

    store.pointerMove(5, 5);
    expect(store.getState()).toMatchObject({ layerId: "high", index: 7 });

    unregisterHigh();
    expect(store.getState()).toMatchObject({ layerId: "low", index: 3 });

    store.pointerLeave();
    expect(store.getState()).toMatchObject({ layerId: null, index: null });
  });
});
