import { Link } from "react-router-dom";

import NExperimentsTable from "@/pages/researcher/NHomePage/components/NExperimentsTable";
import { useNHomePage } from "@/hooks/useNHomePage";

function NHomePage() {
  const { experiments, isLoading, error, stats, refresh } = useNHomePage();

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-sinapgreen-800">
          Eyetracking
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
          Página inicial
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
          Acompanhe os testes criados e acesse rapidamente a criação de um novo
          experimento.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/create"
            className="inline-flex items-center justify-center rounded-full bg-sinapgreen-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-sinapgreen-500/20 transition hover:bg-sinapgreen-800"
          >
            Criar experimento
          </Link>
          <Link
            to="/import"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50"
          >
            Importar teste
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total de testes", value: stats.total },
          { label: "Testes ativos", value: stats.active },
          { label: "Testes inativos", value: stats.inactive },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sinapgreen-800">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-black text-black">{item.value}</p>
          </div>
        ))}
      </div>

      <NExperimentsTable
        experiments={experiments}
        isLoading={isLoading}
        error={error}
        onRefresh={refresh}
      />
    </section>
  );
}

export default NHomePage;
