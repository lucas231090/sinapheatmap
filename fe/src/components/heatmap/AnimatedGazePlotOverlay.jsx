import { useMemo } from "react";
import { computeFixations } from "@/utils/heatmapUtils";
import AnimatedGazePlotSaccades from "./AnimatedGazePlotSaccades";
import AnimatedGazePlotFixations from "./AnimatedGazePlotFixations";
import AnimatedGazePlotLegend from "./AnimatedGazePlotLegend";

/**
 * Animated Gaze Plot overlay for Remotion video context.
 * Shows fixation circles growing progressively as time advances.
 * Circle size is proportional to fixation duration.
 */
const AnimatedGazePlotOverlay = ({
  canvasSize,
  coords,
  coordsBySession,
  selectedSessionId,
  currentTimeMs,
}) => {
  const isMultiSession =
    selectedSessionId === "all" && coordsBySession && coordsBySession.length > 1;

  // Compute fixations per session
  const fixationGroups = useMemo(() => {
    if (isMultiSession && coordsBySession) {
      return coordsBySession.map((sessionGroup) => {
        const fixations = computeFixations(sessionGroup.coords);
        return {
          sessionId: sessionGroup.sessionId,
          participantName: sessionGroup.participantName,
          color: sessionGroup.color,
          fixations,
        };
      });
    }

    const defaultColor = {
      fill: "rgba(255, 0, 0, 0.4)",
      stroke: "#FF6384",
      label: "#FF6384",
    };
    const fixations = computeFixations(coords || []);
    return [
      {
        sessionId: "single",
        participantName: "",
        color: defaultColor,
        fixations,
      },
    ];
  }, [coords, coordsBySession, isMultiSession]);

  // Build flat list with visibility and growth info
  const allFixations = useMemo(() => {
    const result = [];
    fixationGroups.forEach((group) => {
      group.fixations.forEach((fix, localIndex) => {
        result.push({
          ...fix,
          sessionId: group.sessionId,
          participantName: group.participantName,
          color: group.color,
          localIndex,
          globalIndex: result.length,
        });
      });
    });
    return result;
  }, [fixationGroups]);

  // Compute radius range for proportional sizing
  const { minDuration, maxDuration } = useMemo(() => {
    if (allFixations.length === 0) return { minDuration: 0, maxDuration: 1000 };
    const durations = allFixations.map((f) => f.durationMs);
    return {
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }, [allFixations]);

  const getFixationRadius = (durationMs) => {
    const minRadius = 14;
    const maxRadius = 38;
    if (maxDuration <= minDuration) return (minRadius + maxRadius) / 2;
    const t = (durationMs - minDuration) / (maxDuration - minDuration);
    return minRadius + t * (maxRadius - minRadius);
  };

  // Visible fixations: completed (endTime <= currentTimeMs) or in-progress
  const visibleFixations = useMemo(() => {
    return allFixations.reduce((acc, fix) => {
      if (fix.startTime <= currentTimeMs) {
        const isComplete = fix.endTime <= currentTimeMs;
        // For in-progress fixations, compute partial growth
        let growthFactor = 1;
        if (!isComplete) {
          const elapsed = currentTimeMs - fix.startTime;
          growthFactor = Math.min(1, elapsed / fix.durationMs);
        }
        acc.push({ ...fix, isComplete, growthFactor });
      }
      return acc;
    }, []);
  }, [allFixations, currentTimeMs]);

  // Group visible by session for saccade lines
  const sessionGroups = useMemo(() => {
    const groups = {};
    visibleFixations.forEach((fix) => {
      if (!groups[fix.sessionId]) {
        groups[fix.sessionId] = [];
      }
      groups[fix.sessionId].push(fix);
    });
    return groups;
  }, [visibleFixations]);

  // Reversed for rendering: first fixations on top
  const reversedVisible = useMemo(
    () => [...visibleFixations].reverse(),
    [visibleFixations],
  );

  // Latest per session for pulse
  const latestPerSession = useMemo(() => {
    const latest = new Set();
    Object.values(sessionGroups).forEach((group) => {
      if (group.length > 0) {
        latest.add(group[group.length - 1].globalIndex);
      }
    });
    return latest;
  }, [sessionGroups]);

  const lineWidth = 1.2;
  const arrowSize = 5;
  const fontSize = 12;

  // Legend
  const legend = useMemo(() => {
    if (!isMultiSession) return [];
    return fixationGroups.map((group) => ({
      sessionId: group.sessionId,
      participantName: group.participantName,
      color: group.color,
      count: group.fixations.filter((f) => f.startTime <= currentTimeMs).length,
    }));
  }, [isMultiSession, fixationGroups, currentTimeMs]);


  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        pointerEvents: "none",
        zIndex: 13,
      }}
    >
      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        style={{ display: "block", opacity: 0.75 }}
      >
        <AnimatedGazePlotSaccades
          sessionGroups={sessionGroups}
          arrowSize={arrowSize}
          getFixationRadius={getFixationRadius}
          lineWidth={lineWidth}
        />
        <AnimatedGazePlotFixations
          reversedVisible={reversedVisible}
          getFixationRadius={getFixationRadius}
          latestPerSession={latestPerSession}
          fontSize={fontSize}
        />
      </svg>
      <AnimatedGazePlotLegend isMultiSession={isMultiSession} legend={legend} />
    </div>
  );
};

export default AnimatedGazePlotOverlay;
