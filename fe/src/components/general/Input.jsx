const Input = ({ className = "", error, ref, ...props }) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-2xl border bg-white dark:bg-slate-700 dark:text-white px-4 py-3 shadow-sm outline-none transition focus:border-sinapgreen-500 focus:ring-1 focus:ring-sinapgreen-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 ${
          error ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-600"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
