import { createPortal } from "react-dom";
import { useHoverState } from "./hoverStore";

const OFFSET = 16;
const FLIP_X_THRESHOLD = 340;
const FLIP_Y_THRESHOLD = 200;

/**
 * Tooltip rendered in a portal with fixed positioning, so it is never scaled by
 * the zoom transform, never clipped by overflow and always above every layer.
 */
const HoverTooltip = ({ store, accentColor, title, rows = [], footer }) => {
  const { clientX, clientY } = useHoverState(store);

  if (typeof document === "undefined") return null;

  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const flipX = viewportWidth > 0 && clientX > viewportWidth - FLIP_X_THRESHOLD;
  const flipY =
    viewportHeight > 0 && clientY > viewportHeight - FLIP_Y_THRESHOLD;

  const style = {
    position: "fixed",
    left: clientX + (flipX ? -OFFSET : OFFSET),
    top: clientY + (flipY ? -OFFSET : OFFSET),
    transform: `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`,
    zIndex: 9999,
    pointerEvents: "none",
  };

  return createPortal(
    <div
      role="tooltip"
      style={style}
      className="min-w-[200px] max-w-[320px] rounded-xl border border-white/15 bg-slate-900/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-md bg-black/50"
    >
      <div className="mb-1.5 flex items-center gap-2">
        {accentColor && (
          <span
            className="size-2.5 shrink-0 rounded-full ring-2 ring-white/20"
            style={{ backgroundColor: accentColor }}
          />
        )}
        <span className="text-[13px] font-semibold leading-tight">{title}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] leading-snug">
        {rows.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="text-white/55">{label}</dt>
            <dd className="font-mono text-white/95 break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {footer && (
        <div className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/70">
          {footer}
        </div>
      )}
    </div>,
    document.body,
  );
};

export default HoverTooltip;
