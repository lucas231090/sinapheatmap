import { Link } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function NExperimentsTable({
  experiments,
  isLoading,
  error,
  onRefresh,
}) {
  return (
    <section className="rounded-[2rem] bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
            Testes criados
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">
            Tabela de experimentos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            try {
              console.debug("NExperimentsTable: refresh clicked");
              if (typeof onRefresh === "function") onRefresh();
              else
                console.warn("NExperimentsTable: onRefresh is not a function");
            } catch (err) {
              console.error("NExperimentsTable refresh error:", err);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50"
        >
          <RefreshIcon fontSize="small" />
          Atualizar
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-[0.25em] text-slate-700">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Amostras</th>
                <th className="px-4 py-3">Peças</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                    Carregando testes criados...
                  </td>
                </tr>
              ) : experiments.length ? (
                experiments.map((experiment) => (
                  <tr
                    key={experiment.id}
                    className="align-top text-sm text-black"
                  >
                    <td className="px-4 py-4 font-semibold">
                      {experiment.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {experiment.description || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {experiment.createdAt}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {experiment.samplesCount}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {experiment.piecesCount}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          experiment.active
                            ? "bg-cyan-100 text-cyan-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {experiment.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/edit/${experiment.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00C8E6] px-4 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-[#11b5d1]"
                      >
                        Editar
                        <ArrowForwardIcon fontSize="inherit" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                    Nenhum teste foi criado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
