import React from "react";

export default function FileUpload({
  accept = "*",
  onChange,
  title,
  subtitle,
  fileName,
  icon,
  className = "",
}) {
  return (
    <label
      className={`group block cursor-pointer rounded-[1.75rem] border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-5 transition hover:border-sinapgreen-500 hover:bg-sinapgreen-50/40 ${className}`}
    >
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-sinapgreen-100 p-3 text-sinapgreen-800">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-black dark:text-white">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
          <p className="mt-2 truncate text-sm font-medium text-slate-900 dark:text-slate-200">
            {fileName ||
              (accept.includes("csv")
                ? "Nenhum CSV selecionado"
                : "Nenhuma mídia selecionada")}
          </p>
        </div>
      </div>
    </label>
  );
}
