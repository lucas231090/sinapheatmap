import { Link } from "react-router-dom";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import NExperimentsTable from "@/pages/researcher/NHomePage/components/NExperimentsTable";
import { useNHomePage } from "@/hooks/useNHomePage";

function NHomePage() {
  const { experiments, isLoading, error, stats, refresh } = useNHomePage();

  return (
    <section className="flex flex-col gap-10">
      <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)] sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-sinapgreen-800">
            Painel do pesquisador
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-black sm:text-4xl lg:text-5xl">
            Página inicial
          </h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Acompanhe os testes criados, crie novos experimentos e importe dados
            sem sair da visão geral.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/create"
            className="inline-flex h-full min-h-20 items-center justify-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5 text-base font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg"
          >
            <AddCircleOutlineIcon fontSize="small" />
            Criar experimento
          </Link>
          <Link
            to="/import"
            className="inline-flex h-full min-h-20 items-center justify-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5 text-base font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg"
          >
            <FileUploadIcon fontSize="small" />
            Importar teste
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <NExperimentsTable
          experiments={experiments}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
        />
      </div>
    </section>
  );
}

export default NHomePage;
