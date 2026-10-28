import { useMemo } from "react";
import { interpolateCoordinates, simplifyPath } from "@/utils/heatmapUtils";

export function useHeatmapSessionData({
  heatmapData,
  coordsBySession,
  selectedSessionId,
  activeModes,
  currentTimeMs,
}) {
  const isMultiSession =
    selectedSessionId === "all" &&
    coordsBySession &&
    coordsBySession.length > 1;

  const sessionData = useMemo(() => {
    if (isMultiSession) {
      return coordsBySession.map((group) => {
        let coords = group.coords || [];
        if (activeModes.heatmapOnlyBubbles) {
          coords = simplifyPath(coords, 6).map((c) => ({ ...c, value: 200 }));
        } else {
          coords = interpolateCoordinates(coords);
        }
        return { ...group, interpolated: coords };
      });
    }

    // Única sessão
    let coords = heatmapData.coords || [];
    if (activeModes.heatmapOnlyBubbles) {
      coords = simplifyPath(coords, 6).map((c) => ({ ...c, value: 200 }));
    } else {
      coords = interpolateCoordinates(coords);
    }
    return [{ sessionId: "single", interpolated: coords, color: null }];
  }, [
    heatmapData.coords,
    coordsBySession,
    isMultiSession,
    activeModes.heatmapOnlyBubbles,
  ]);

  const totalPointsAllSessions = useMemo(
    () =>
      sessionData.reduce((acc, group) => acc + group.interpolated.length, 0),
    [sessionData]
  );

  const expectedDurationMs = useMemo(() => {
    return Number(heatmapData.durationMs) > 0
      ? Number(heatmapData.durationMs)
      : Number(heatmapData.exposureSeconds) > 0
      ? Number(heatmapData.exposureSeconds) * 1000
      : totalPointsAllSessions > 0
      ? sessionData[0].interpolated[sessionData[0].interpolated.length - 1]
          ?.timestamp || 0
      : 0;
  }, [
    heatmapData.durationMs,
    heatmapData.exposureSeconds,
    totalPointsAllSessions,
    sessionData,
  ]);

  const sessionCurrentCoords = useMemo(() => {
    return sessionData.map((group) => {
      const coords = group.interpolated;
      const total = coords.length;
      let latestIdx = coords.findIndex((c) => c.timestamp > currentTimeMs) - 1;
      if (latestIdx === -2) latestIdx = total - 1;
      if (latestIdx < 0) latestIdx = 0;

      let current = coords.slice(0, latestIdx + 1);

      if (activeModes.fadeModeVisible) {
        const windowStart = currentTimeMs - 3000;
        current = current.filter((c) => (c.timestamp ?? 0) >= windowStart);
        current = current.map((c) => {
          const age = currentTimeMs - (c.timestamp ?? 0);
          const factor = Math.max(0, 1 - age / 3000);
          const baseValue = c.value || 50;
          return { ...c, value: baseValue * factor };
        });
      }
      return {
        ...group,
        currentCoords: current,
        latestIdx,
        totalPoints: total,
      };
    });
  }, [sessionData, currentTimeMs, activeModes.fadeModeVisible]);

  return {
    sessionData,
    totalPointsAllSessions,
    expectedDurationMs,
    sessionCurrentCoords,
  };
}
