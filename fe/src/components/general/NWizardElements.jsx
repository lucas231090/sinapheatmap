import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export function ActionButton({
  children,
  icon,
  onClick,
  type = "button",
  variant = "solid",
  disabled = false,
  className = "",
}) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 disabled:cursor-not-allowed disabled:opacity-50";
  const variantClasses =
    variant === "ghost"
      ? "border border-slate-200 bg-white text-black shadow-sm hover:bg-slate-50"
      : "bg-[#00C8E6] text-black shadow-lg shadow-cyan-500/20 hover:translate-y-[-1px] hover:bg-[#11b5d1]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function InputField({ label, className = "", ...props }) {
  return (
    <label className="block space-y-2 ">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-2xl border border-black/15 bg-slate-100 px-4 py-3 text-sm text-black placeholder:text-slate-500 shadow-sm transition focus:border-cyan-500 focus:bg-white focus:outline-none ${className}`}
      />
    </label>
  );
}

export function TextAreaField({ label, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
        {label}
      </span>
      <textarea
        {...props}
        className={`min-h-[140px] w-full rounded-2xl border border-black/15 bg-slate-100 px-4 py-3 text-sm text-black placeholder:text-slate-500 shadow-sm transition focus:border-cyan-500 focus:bg-white focus:outline-none ${className}`}
      />
    </label>
  );
}

export function SectionTitle({ kicker, title, description }) {
  return (
    <div className="space-y-1">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
          {kicker}
        </p>
      ) : null}
      <h2 className="text-xl font-semibold text-black sm:text-2xl">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function CardPanel({ children, className = "" }) {
  return (
    <section
      className={`rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function RowCard({
  title,
  subtitle,
  badge,
  thumbnail,
  selected = false,
  onClick,
  onDelete,
  onMoveLeft,
  onMoveRight,
  controlsDisabled = false,
  orientation = "horizontal",
  draggableProps,
  className = "",
}) {
  const isVertical = orientation === "vertical";
  const moveLeftLabel = isVertical
    ? "Mover para cima"
    : "Mover para a esquerda";
  const moveRightLabel = isVertical
    ? "Mover para baixo"
    : "Mover para a direita";
  const leftIcon = isVertical ? (
    <ArrowUpwardIcon fontSize="small" />
  ) : (
    <ArrowBackIcon fontSize="small" />
  );
  const rightIcon = isVertical ? (
    <ArrowDownwardIcon fontSize="small" />
  ) : (
    <ArrowForwardIcon fontSize="small" />
  );

  return (
    <div
      {...draggableProps}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex items-center gap-3 rounded-3xl border bg-[#00C8E6] p-3 text-black shadow-sm transition ${
        selected ? "border-black/40 ring-2 ring-black/20" : "border-cyan-100"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-inner">
        {thumbnail}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-black/70">{subtitle}</p>
        ) : null}
        {badge ? (
          <span className="inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMoveLeft?.();
          }}
          disabled={controlsDisabled}
          className="rounded-full bg-white p-2 text-black transition hover:bg-slate-100 disabled:opacity-40 w-10 h-auto leading-none"
          aria-label={moveLeftLabel}
        >
          {leftIcon}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMoveRight?.();
          }}
          disabled={controlsDisabled}
          className="rounded-full bg-white p-2 text-black transition hover:bg-slate-100 disabled:opacity-40 w-10 h-auto leading-none"
          aria-label={moveRightLabel}
        >
          {rightIcon}
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            disabled={controlsDisabled}
            className="rounded-full bg-white p-2 text-black transition hover:bg-red-50 disabled:opacity-40"
            aria-label="Remover item"
          >
            <DeleteOutlineIcon fontSize="small" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
