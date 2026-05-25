import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@/components/general/Button";

export default function NPageHeader({
  title,
  description,
  backHref = "/home",
  backLabel = "HOMEPAGE",
  children,
}) {
  return (
    <header className="rounded-[2rem] bg-white p-6">
      <div className="flex flex-col gap-4 justify-center lg:flex-row items-center md:items-start lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl text-center md:text-start font-black uppercase tracking-tight sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-center md:text-start text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {children}
          <Button
            asLink
            to={backHref}
            variant="secondary"
            className="px-5 py-3"
          >
            <ArrowBackIcon fontSize="small" />
            <span>{backLabel}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
