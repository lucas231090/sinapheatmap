import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

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
      : "bg-sinapgreen-500 text-black shadow-lg shadow-sinapgreen-500/20 hover:translate-y-[-1px] hover:bg-sinapgreen-800";

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
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black dark:text-white">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-2xl border border-black/15 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm transition focus:border-sinapgreen-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:active:bg-slate-700 ${className} `}
      />
    </label>
  );
}

export function TextAreaField({ label, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black dark:text-white">
        {label}
      </span>
      <textarea
        {...props}
        className={`min-h-[140px] w-full rounded-2xl border border-black/15 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm transition focus:border-sinapgreen-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none dark:active:bg-slate-700 ${className}`}
      />
    </label>
  );
}

export function SectionTitle({ kicker, title, description }) {
  return (
    <div className="space-y-1">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sinapgreen-900 dark:text-sinapgreen-500">
          {kicker}
        </p>
      ) : null}
      <h2 className="text-xl font-semibold text-black dark:text-white sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function CardPanel({ children, className = "" }) {
  return (
    <section
      className={`rounded-[1.75rem] border border-slate-200 bg-slate-50 dark:bg-slate-800 p-5 ${className}`}
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
      className={`flex items-center gap-3 rounded-3xl border bg-sinapgreen-500 p-3 text-black shadow-sm transition ${
        selected ? "border-black/40 ring-2 ring-black/20" : "border-cyan-100"
      } ${className}`}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex flex-1 items-center gap-3 text-left bg-transparent border-0 p-0 outline-none cursor-pointer min-w-0"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-inner">
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
        </button>
      ) : (
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-inner">
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
        </div>
      )}
      <div className="flex items-center gap-1 shrink-0">
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
