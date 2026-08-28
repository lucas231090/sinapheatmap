import { Link } from "react-router-dom";

const variants = {
  primary:
    "bg-[#00BED5] text-white hover:bg-[#00a8bc] dark:hover:bg-[#00a8bc] border border-transparent shadow-sm",
  secondary:
    "bg-white text-black dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 border border-transparent shadow-sm",
  ghost:
    "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
  icon: "h-10 w-10 p-0",
};

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  asLink = false,
  to,
  disabled,
  type = "button",
  ref,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BED5]/50 disabled:pointer-events-none disabled:opacity-60";
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;

  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;

  if (asLink) {
    return (
      <Link to={to} className={combinedClasses} ref={ref} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
