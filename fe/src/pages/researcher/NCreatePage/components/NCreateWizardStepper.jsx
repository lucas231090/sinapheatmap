export default function NCreateWizardStepper({ activeStep, labels }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {labels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isDone = stepNumber < activeStep;

        return (
          <div
            key={label}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-sinapgreen-500 bg-cyan-50 dark:bg-slate-900 text-black dark:text-white"
                : isDone
                  ? "border-cyan-200 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  : "border-slate-200 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }`}
          >
            <span className="mr-3 inline-flex size-7 items-center justify-center rounded-full bg-sinapgreen-500 text-xs font-black text-black">
              {stepNumber}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}
