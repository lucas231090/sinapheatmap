import { useEffect, useSyncExternalStore } from "react";

/**
 * Centralised hover system for the heatmap overlays.
 *
 * Instead of relying on per-element mouseenter/mouseleave (which breaks with
 * overlapping SVG layers, hidden layers and zoom transforms), a single surface
 * element reports the cursor position. The position is converted to canvas
 * coordinates using getBoundingClientRect (which already accounts for any CSS
 * transform such as zoom/pan) and every registered layer performs a geometric
 * hit-test. The highest-priority layer that hits wins.
 */

const EMPTY_STATE = Object.freeze({
  layerId: null,
  index: null,
  clientX: 0,
  clientY: 0,
});

export const createHoverStore = () => {
  let surface = null;
  let canvasSize = { width: 0, height: 0 };
  let lastClient = null;
  let state = EMPTY_STATE;
  const layers = new Map();
  const listeners = new Set();

  const emit = (next) => {
    if (
      next.layerId === state.layerId &&
      next.index === state.index &&
      next.clientX === state.clientX &&
      next.clientY === state.clientY
    ) {
      return;
    }
    state = next;
    listeners.forEach((listener) => listener());
  };

  const toCanvasPoint = (clientX, clientY) => {
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    const scaleX =
      rect.width > 0 && canvasSize.width > 0 ? canvasSize.width / rect.width : 1;
    const scaleY =
      rect.height > 0 && canvasSize.height > 0
        ? canvasSize.height / rect.height
        : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      // How many canvas units correspond to one screen pixel.
      unitsPerPixel: scaleX,
    };
  };

  const resolve = () => {
    if (!lastClient) {
      emit(EMPTY_STATE);
      return;
    }
    const point = toCanvasPoint(lastClient.clientX, lastClient.clientY);
    if (point) {
      const ordered = [...layers.entries()].sort(
        (a, b) => b[1].priority - a[1].priority,
      );
      for (const [layerId, layer] of ordered) {
        const index = layer.hitTest(point.x, point.y, point.unitsPerPixel);
        if (index !== null && index !== undefined) {
          emit({ layerId, index, ...lastClient });
          return;
        }
      }
    }
    emit({ ...EMPTY_STATE, ...lastClient });
  };

  return {
    setSurface(element, size) {
      if (!element) return;
      const changed =
        element !== surface ||
        size?.width !== canvasSize.width ||
        size?.height !== canvasSize.height;
      surface = element;
      canvasSize = size || canvasSize;
      if (changed) resolve();
    },
    pointerMove(clientX, clientY) {
      lastClient = { clientX, clientY };
      resolve();
    },
    pointerLeave() {
      lastClient = null;
      resolve();
    },
    refresh() {
      resolve();
    },
    registerLayer(layerId, layer) {
      layers.set(layerId, layer);
      resolve();
      return () => {
        if (layers.get(layerId) === layer) {
          layers.delete(layerId);
          resolve();
        }
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },
  };
};

/**
 * Generic hit-test for a list of circles. Prefers the top-most circle that
 * actually contains the point (what the user sees), falling back to the nearest
 * circle within a small screen-pixel tolerance.
 *
 * @param {Array} items  items in top-to-bottom visual order
 * @param {(item) => number} getRadius radius in canvas units
 */
export const hitTestCircles = (
  items,
  getRadius,
  x,
  y,
  unitsPerPixel,
  tolerancePx = 6,
) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const r = getRadius(item);
    const dx = item.x - x;
    const dy = item.y - y;
    if (dx * dx + dy * dy <= r * r) return i;
  }

  const tolerance = tolerancePx * (unitsPerPixel || 1);
  let best = null;
  let bestGap = Infinity;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const gap = Math.hypot(item.x - x, item.y - y) - getRadius(item);
    if (gap <= tolerance && gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  return best;
};

/** Registers a hover layer and returns the index currently hovered on it. */
export const useHoverLayer = (store, layerId, { priority, hitTest, enabled }) => {
  useEffect(() => {
    if (!enabled) return undefined;
    return store.registerLayer(layerId, { priority, hitTest });
  }, [store, layerId, priority, hitTest, enabled]);

  return useSyncExternalStore(store.subscribe, () => {
    const current = store.getState();
    return current.layerId === layerId ? current.index : null;
  });
};

/** Subscribes to the full hover state (cursor position included). */
export const useHoverState = (store) =>
  useSyncExternalStore(store.subscribe, store.getState);

/** Mouse handlers to attach to the element acting as the hover surface. */
export const getSurfaceHandlers = (store) => ({
  onMouseMove: (event) => {
    if (event.buttons !== 0 || event.target?.closest?.("[data-hover-ignore]")) {
      store.pointerLeave();
      return;
    }
    store.pointerMove(event.clientX, event.clientY);
  },
  onMouseLeave: () => store.pointerLeave(),
  onMouseDown: () => store.pointerLeave(),
});
